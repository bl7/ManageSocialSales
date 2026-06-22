"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordExpenseAction } from "@/actions/expenses";
import { quickCreateExpenseCategoryAction } from "@/actions/expense-categories";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { Textarea } from "@/components/ui/textarea";
import { CreatableSelect, type CreatableOption } from "@/components/ui/creatable-select";
import { AccountSelect } from "@/components/ui/account-select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";
import { todayISODate } from "@/lib/date-ranges";

interface ExpenseFormProps {
  categories: { id: string; name: string }[];
  accounts: { id: string; name: string }[];
}

export function ExpenseForm({
  categories: initialCategories,
  accounts,
  compact = false,
  redirectTo = "/expenses",
}: ExpenseFormProps & { compact?: boolean; redirectTo?: string | false }) {
  const router = useRouter();
  const today = todayISODate();
  const [state, action, pending] = useActionState(recordExpenseAction, null);
  const [categoryId, setCategoryId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<CreatableOption[]>(() =>
    initialCategories.map((c) => ({ id: c.id, label: c.name }))
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Expense recorded");
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    }
  }, [state, router, redirectTo]);

  async function handleCreateCategory(name: string) {
    const result = await quickCreateExpenseCategoryAction(name);
    if ("success" in result && result.success === false) {
      toast.error(result.error);
      return null;
    }
    if ("id" in result) {
      toast.success(`Category "${result.name}" added`);
      return { id: result.id, label: result.name };
    }
    return null;
  }

  return (
    <div>
      {!compact && (
        <PageHeader title="Record Expense" description="Business expenses (rent, shipping, etc.)" />
      )}

      <form action={action} className="max-w-lg">
        {state && !state.success && <div className="mb-4"><ErrorMessage message={state.error} /></div>}

        <fieldset disabled={pending} className="rounded-xl border border-border bg-card p-5 space-y-4 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="expense_date">Date *</Label>
            <NepaliDateInput id="expense_date" name="expense_date" required defaultValue={today} />
          </FormGroup>
          <FormGroup>
            <Label>Category *</Label>
            <CreatableSelect
              name="category_id"
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
              onOptionsChange={setCategoryOptions}
              onCreate={handleCreateCategory}
              placeholder="Search or add category..."
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="amount">Amount *</Label>
            <MoneyInput id="amount" name="amount" required />
          </FormGroup>
          <AccountSelect accounts={accounts} label="Paid from account" />
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
