"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  recordInvestmentAction,
  updateInvestmentAction,
  deleteInvestmentAction,
} from "@/actions/investments";
import { quickCreateInvestorAction } from "@/actions/investors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CreatableSelect, type CreatableOption } from "@/components/ui/creatable-select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";
import { formatCurrency } from "@/lib/utils";
import { todayISODate } from "@/lib/date-ranges";

interface AllocationRow {
  account_id: string;
  amount: number;
}

interface Props {
  accounts: { id: string; name: string }[];
  investors: { id: string; name: string }[];
  currency?: string;
  investment?: {
    id: string;
    investor_id: string | null;
    investment_date: string;
    notes: string | null;
    allocations: AllocationRow[];
  };
}

export function InvestmentForm({
  accounts,
  investors: initialInvestors,
  currency = "Rs.",
  investment,
}: Props) {
  const router = useRouter();
  const today = todayISODate();
  const isEdit = Boolean(investment);
  const defaultAccountId = accounts.find((a) => a.name === "Cash")?.id ?? accounts[0]?.id ?? "";

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [investorId, setInvestorId] = useState(investment?.investor_id ?? "");
  const [investorOptions, setInvestorOptions] = useState<CreatableOption[]>(() =>
    initialInvestors.map((i) => ({ id: i.id, label: i.name }))
  );
  const [allocations, setAllocations] = useState<AllocationRow[]>(
    investment?.allocations.length
      ? investment.allocations.map((a) => ({ account_id: a.account_id, amount: a.amount }))
      : [{ account_id: defaultAccountId, amount: 0 }]
  );

  const total = allocations.reduce((sum, row) => sum + (row.amount || 0), 0);

  function updateRow(index: number, field: keyof AllocationRow, value: string | number) {
    setAllocations((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addRow() {
    setAllocations((prev) => [...prev, { account_id: defaultAccountId, amount: 0 }]);
  }

  function removeRow(index: number) {
    if (allocations.length <= 1) return;
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateInvestor(name: string) {
    const result = await quickCreateInvestorAction(name);
    if ("success" in result && result.success === false) {
      toast.error(result.error);
      return null;
    }
    if ("id" in result) {
      toast.success(`Investor "${result.name}" added`);
      return { id: result.id, label: result.name };
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    if (!investorId) {
      setError("Select an investor.");
      setPending(false);
      return;
    }

    const valid = allocations.filter((row) => row.account_id && row.amount > 0);
    if (valid.length === 0) {
      setError("Add at least one account with an amount.");
      setPending(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("investor_id", investorId);
    formData.set("allocations", JSON.stringify(valid));
    if (investment) formData.set("investment_id", investment.id);

    const result = isEdit
      ? await updateInvestmentAction(null, formData)
      : await recordInvestmentAction(null, formData);

    if (result?.success) {
      toast.success(isEdit ? "Investment updated" : "Investment recorded");
      router.push("/investment");
      router.refresh();
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!investment) return;
    setPending(true);
    const result = await deleteInvestmentAction(investment.id);
    if (result.success) {
      toast.success("Investment deleted");
      router.push("/investment");
      router.refresh();
      return;
    }
    toast.error(result.error);
    setPending(false);
    setConfirmOpen(false);
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Investment" : "Add Investment"}
        description="Split capital across Cash, Bank, eSewa, Khalti, etc."
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending} className="space-y-4 rounded-xl border border-border bg-card p-5 disabled:opacity-60">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label>Investor *</Label>
              <CreatableSelect
                name="investor_id_display"
                value={investorId}
                onChange={setInvestorId}
                options={investorOptions}
                onOptionsChange={setInvestorOptions}
                onCreate={handleCreateInvestor}
                placeholder="Search or add investor..."
                createLabel={(q) => `Add investor "${q}"`}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="investment_date">Investment Date *</Label>
              <NepaliDateInput
                id="investment_date"
                name="investment_date"
                required
                defaultValue={investment?.investment_date ?? today}
              />
            </FormGroup>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>Account splits *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>Add account</Button>
            </div>
            <div className="space-y-3">
              {allocations.map((row, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_140px_auto]">
                  <Select
                    value={row.account_id}
                    onChange={(e) => updateRow(index, "account_id", e.target.value)}
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount"
                    value={row.amount || ""}
                    onChange={(e) => updateRow(index, "amount", parseFloat(e.target.value) || 0)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRow(index)}
                    disabled={allocations.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-medium">Total: {formatCurrency(total, currency)}</p>
          </div>

          <FormGroup>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Optional" defaultValue={investment?.notes ?? ""} />
          </FormGroup>

          <div className="flex flex-wrap gap-3">
            <Button type="submit">{pending ? "Saving..." : isEdit ? "Update Investment" : "Record Investment"}</Button>
            {isEdit && (
              <Button type="button" variant="danger" onClick={() => setConfirmOpen(true)}>
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </fieldset>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete investment?"
        message="This will reverse the account ledger entries for this investment."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        loading={pending}
      />
    </div>
  );
}
