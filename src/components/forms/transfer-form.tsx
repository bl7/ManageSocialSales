"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordTransferAction } from "@/actions/account-movements";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";
import { formatCurrency } from "@/lib/utils";
import { todayISODate } from "@/lib/date-ranges";

export function TransferForm({
  accounts,
  currency = "Rs.",
}: {
  accounts: { id: string; name: string; current_balance: number }[];
  currency?: string;
}) {
  const router = useRouter();
  const today = todayISODate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const fromAccount = accounts.find((a) => a.id === fromId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await recordTransferAction(null, formData);
    if (result?.success) {
      toast.success("Transfer recorded");
      router.push("/transactions");
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
      <PageHeader title="Transfer Money" description="Move funds between Cash, Bank, eSewa, Khalti, etc." />

      <form onSubmit={handleSubmit} className="max-w-lg">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending} className="space-y-4 rounded-xl border border-border bg-card p-5 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="transfer_date">Date *</Label>
            <NepaliDateInput id="transfer_date" name="transfer_date" required defaultValue={today} />
          </FormGroup>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label htmlFor="from_account_id">From account *</Label>
              <Select
                id="from_account_id"
                name="from_account_id"
                required
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.current_balance, currency)})
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="to_account_id">To account *</Label>
              <Select id="to_account_id" name="to_account_id" required defaultValue={accounts[1]?.id ?? ""}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </FormGroup>
          </div>

          {fromAccount && (
            <p className="text-sm text-muted">
              Available in {fromAccount.name}: {formatCurrency(fromAccount.current_balance, currency)}
            </p>
          )}

          <FormGroup>
            <Label htmlFor="amount">Amount *</Label>
            <MoneyInput id="amount" name="amount" required />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Optional" />
          </FormGroup>

          <div className="flex gap-3">
            <Button type="submit">{pending ? "Saving..." : "Transfer"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
