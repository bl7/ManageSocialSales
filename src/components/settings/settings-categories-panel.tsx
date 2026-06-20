import Link from "next/link";
import { getProductCategoriesWithCounts } from "@/lib/queries/categories";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";

export async function SettingsCategoriesPanel() {
  const categories = await getProductCategoriesWithCounts();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Product Categories</h3>
        <Link href="/settings/categories/new"><Button size="sm">Add Category</Button></Link>
      </div>
      {categories.length === 0 ? (
        <EmptyState message="No categories yet." actionLabel="Add Category" actionHref="/settings/categories/new" />
      ) : (
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3"></th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.product_count}</td>
                <td className="px-4 py-3">
                  <Link href={`/settings/categories/${c.id}/edit`} className="text-sm text-primary hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
