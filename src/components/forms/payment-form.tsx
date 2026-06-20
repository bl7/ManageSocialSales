"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordPaymentAction } from "@/actions/parties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormGroup, Label, ErrorMessage } from "@/components/ui/page";
import { todayISODate } from "@/lib/date-ranges";

interface PaymentFormProps {
  partyId: string;
  defaultDirection: "received" | "paid";
}

export function PaymentForm({ partyId, defaultDirection }: PaymentFormProps) {
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
    <form action={action} className="space-y-3">
      <input type="hidden" name="party_id" value={partyId} />
      {state && !state.success && <ErrorMessage message={state.error} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <FormGroup>
          <Label htmlFor="payment_date">Date *</Label>
          <Input id="payment_date" name="payment_date" type="date" required defaultValue={today} />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="direction">Type *</Label>
          <Select id="direction" name="direction" defaultValue={defaultDirection}>
            <option value="received">Received (payment in)</option>
            <option value="paid">Paid (payment out)</option>
          </Select>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="amount">Amount *</Label>
          <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="payment_method">Method</Label>
          <Select id="payment_method" name="payment_method" defaultValue="cash">
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="esewa">eSewa</option>
            <option value="other">Other</option>
          </Select>
        </FormGroup>
      </div>
      <FormGroup>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </FormGroup>
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Record Payment"}</Button>
    </form>
  );
}
