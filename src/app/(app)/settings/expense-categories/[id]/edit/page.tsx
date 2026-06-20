import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import { T } from "@/lib/tables";
import { ExpenseCategoryForm } from "@/components/forms/expense-category-form";
import { PageHeader } from "@/components/ui/page";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditExpenseCategoryPage({ params }: Props) {
  const { id } = await params;
  const category = await queryOne<{ id: string; name: string; is_active: boolean }>(
    `SELECT * FROM ${T.expenseCategories} WHERE id = $1`,
    [id]
  );
  if (!category || !category.is_active) notFound();
  return (
    <div>
      <PageHeader title="Edit Expense Category" />
      <ExpenseCategoryForm category={{ id: category.id, name: category.name }} />
    </div>
  );
}
