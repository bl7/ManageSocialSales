import { ExpenseCategoryForm } from "@/components/forms/expense-category-form";
import { PageHeader } from "@/components/ui/page";

export default function NewExpenseCategoryPage() {
  return (
    <div>
      <PageHeader title="Add Expense Category" />
      <ExpenseCategoryForm />
    </div>
  );
}
