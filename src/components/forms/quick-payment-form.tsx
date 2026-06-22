"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordPaymentAction } from "@/actions/parties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { AccountSelect } from "@/components/ui/account-select";
import { FormGroup, Label, ErrorMessage } from "@/components/ui/page";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";
import { todayISODate } from "@/lib/date-ranges";

interface Props {
  parties: { id: string; name: string; phone?: string | null }[];
  accounts: { id: string; name: string }[];
}

export function QuickPaymentForm({ parties, accounts }: Props) {
  const router = useRouter();
  const today = todayISODate();
  const [state, action, pending] = useActionState(recordPaymentAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Payment recorded");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="max-w-lg">
      {state && !state.success && <div className="mb-4"><ErrorMessage message={state.error} /></div>}

      <fieldset disabled={pending} className="rounded-xl border border-border bg-card p-5 space-y-4 disabled:opacity-60">
        <FormGroup>
          <Label htmlFor="party_id">Party *</Label>
          <Select id="party_id" name="party_id" required defaultValue="">
            <option value="" disabled>Select party…</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.phone ? ` (${p.phone})` : ""}
              </option>
            ))}
          </Select>
        </FormGroup>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormGroup>
            <Label htmlFor="payment_date">Date *</Label>
            <NepaliDateInput id="payment_date" name="payment_date" required defaultValue={today} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="direction">Type *</Label>
            <Select id="direction" name="direction" defaultValue="received">
              <option value="received">Received (payment in)</option>
              <option value="paid">Paid (payment out)</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="amount">Amount *</Label>
            <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
          </FormGroup>
          <AccountSelect accounts={accounts} label="Account *" />
        </div>
        <FormGroup>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" />
        </FormGroup>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Record Payment"}</Button>
      </fieldset>
    </form>
  );
}
