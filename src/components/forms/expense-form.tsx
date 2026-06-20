"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordExpenseAction } from "@/actions/expenses";
import { quickCreateExpenseCategoryAction } from "@/actions/expense-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CreatableSelect, type CreatableOption } from "@/components/ui/creatable-select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { todayISODate } from "@/lib/date-ranges";

interface ExpenseFormProps {
  categories: { id: string; name: string }[];
}

export function ExpenseForm({ categories: initialCategories }: ExpenseFormProps) {
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
      router.push("/expenses");
    }
  }, [state, router]);

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
      <PageHeader title="Record Expense" description="Business expenses (rent, shipping, etc.)" />

      <form action={action} className="max-w-lg">
        {state && !state.success && <div className="mb-4"><ErrorMessage message={state.error} /></div>}

        <fieldset disabled={pending} className="rounded-xl border border-border bg-card p-5 space-y-4 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="expense_date">Date *</Label>
            <Input id="expense_date" name="expense_date" type="date" required defaultValue={today} />
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
