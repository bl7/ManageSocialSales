"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordInvestmentAction } from "@/actions/investments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { formatCurrency } from "@/lib/utils";
import { todayISODate } from "@/lib/date-ranges";

interface AllocationRow {
  account_id: string;
  amount: number;
}

export function InvestmentForm({
  accounts,
  currency = "Rs.",
}: {
  accounts: { id: string; name: string }[];
  currency?: string;
}) {
  const router = useRouter();
  const today = todayISODate();
  const defaultAccountId = accounts.find((a) => a.name === "Cash")?.id ?? accounts[0]?.id ?? "";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [allocations, setAllocations] = useState<AllocationRow[]>([
    { account_id: defaultAccountId, amount: 0 },
  ]);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const valid = allocations.filter((row) => row.account_id && row.amount > 0);
    if (valid.length === 0) {
      setError("Add at least one account with an amount.");
      setPending(false);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("allocations", JSON.stringify(valid));

    const result = await recordInvestmentAction(null, formData);
    if (result?.success) {
      toast.success("Investment recorded");
      router.push("/investment");
      router.refresh();
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader title="Add Investment" description="Split capital across Cash, Bank, eSewa, Khalti, etc." />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending} className="space-y-4 rounded-xl border border-border bg-card p-5 disabled:opacity-60">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label htmlFor="investor_name">Investor Name *</Label>
              <Input id="investor_name" name="investor_name" required placeholder="e.g. Owner, Partner" />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="investment_date">Investment Date *</Label>
              <Input id="investment_date" name="investment_date" type="date" required defaultValue={today} />
            </FormGroup>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>Account splits *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                Add account
              </Button>
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
            <p className="mt-3 text-sm font-medium">
              Total: {formatCurrency(total, currency)}
            </p>
          </div>

          <FormGroup>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Optional — round, purpose, etc." />
          </FormGroup>

          <div className="flex gap-3">
            <Button type="submit">{pending ? "Saving..." : "Record Investment"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
