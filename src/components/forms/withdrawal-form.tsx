"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordProfitWithdrawalAction } from "@/actions/account-movements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { AccountSelect } from "@/components/ui/account-select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";
import { todayISODate } from "@/lib/date-ranges";

export function WithdrawalForm({
  accounts,
  investors,
}: {
  accounts: { id: string; name: string }[];
  investors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const today = todayISODate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await recordProfitWithdrawalAction(null, formData);
    if (result?.success) {
      toast.success("Profit withdrawal recorded");
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
      <PageHeader
        title="Withdraw Profit"
        description="Record profit taken out by an investor or owner. This reduces account balance but not ownership share."
      />

      <form onSubmit={handleSubmit} className="max-w-lg">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending} className="space-y-4 rounded-xl border border-border bg-card p-5 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="withdrawal_date">Date *</Label>
            <NepaliDateInput id="withdrawal_date" name="withdrawal_date" required defaultValue={today} />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="investor_id">Investor (optional)</Label>
            <Select id="investor_id" name="investor_id" defaultValue="">
              <option value="">General / not linked</option>
              {investors.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.name}</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="amount">Amount *</Label>
            <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
          </FormGroup>

          <AccountSelect accounts={accounts} label="Withdraw from account *" />

          <FormGroup>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="e.g. Monthly profit share" />
          </FormGroup>

          <div className="flex gap-3">
            <Button type="submit">{pending ? "Saving..." : "Record Withdrawal"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
