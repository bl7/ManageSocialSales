"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordInvestmentAction } from "@/actions/investments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { todayISODate } from "@/lib/date-ranges";

export function InvestmentForm() {
  const router = useRouter();
  const today = todayISODate();
  const [state, action, pending] = useActionState(recordInvestmentAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Investment recorded");
      router.push("/investment");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div>
      <PageHeader title="Add Investment" description="Record capital invested in the business" />

      <form action={action} className="max-w-lg">
        {state && !state.success && <div className="mb-4"><ErrorMessage message={state.error} /></div>}

        <fieldset disabled={pending} className="rounded-xl border border-border bg-card p-5 space-y-4 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="investor_name">Investor Name *</Label>
            <Input id="investor_name" name="investor_name" required placeholder="e.g. Owner, Partner, Family" />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="investment_date">Investment Date *</Label>
            <Input id="investment_date" name="investment_date" type="date" required defaultValue={today} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="amount">Amount *</Label>
            <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
          </FormGroup>
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
