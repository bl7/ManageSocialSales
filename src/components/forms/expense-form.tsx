"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordExpenseAction } from "@/actions/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { todayISODate } from "@/lib/date-ranges";

interface ExpenseFormProps {
  categories: { id: string; name: string }[];
}

export function ExpenseForm({ categories }: ExpenseFormProps) {
  const router = useRouter();
  const today = todayISODate();
  const [state, action, pending] = useActionState(recordExpenseAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Expense recorded");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div>
      <PageHeader title="Record Expense" description="Business expenses (rent, shipping, etc.)" />

      <form action={action} className="max-w-lg">
        {state && !state.success && <div className="mb-4"><ErrorMessage message={state.error} /></div>}

        <fieldset disabled={pending} className="rounded-xl border border-border bg-card p-5 space-y-4 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="expense_date">Date *</Label>
            <Input id="expense_date" name="expense_date" type="date" required defaultValue={today} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="category_id">Category *</Label>
            <Select id="category_id" name="category_id" required defaultValue="">
              <option value="" disabled>Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="amount">Amount *</Label>
            <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select id="payment_method" name="payment_method" defaultValue="cash">
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="esewa">eSewa</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </FormGroup>
          <Button type="submit">{pending ? "Saving..." : "Record Expense"}</Button>
        </fieldset>
      </form>
    </div>
  );
}
