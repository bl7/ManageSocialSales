import Link from "next/link";
import { getExpenseCategories } from "@/lib/queries/expenses";
import { EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";

export async function SettingsExpenseCategoriesPanel() {
  const categories = await getExpenseCategories();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Expense Categories</h3>
        <Link href="/settings/expense-categories/new"><Button size="sm">Add Category</Button></Link>
      </div>
      {categories.length === 0 ? (
        <EmptyState message="No expense categories yet." actionLabel="Add Category" actionHref="/settings/expense-categories/new" />
      ) : (
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3"></th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">
                  <Link href={`/settings/expense-categories/${c.id}/edit`} className="text-sm text-primary hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
