import Link from "next/link";
import { getProductCategoriesWithCounts } from "@/lib/queries/categories";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";

export default async function CategoriesPage() {
  const categories = await getProductCategoriesWithCounts();

  return (
    <div>
      <PageHeader title="Categories" description="Clothing categories for products">
        <Link href="/categories/new"><Button>Add Category</Button></Link>
      </PageHeader>

      {categories.length === 0 ? (
        <EmptyState message="No categories yet." actionLabel="Add Category" actionHref="/categories/new" />
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
                  <Link href={`/categories/${c.id}/edit`} className="text-sm text-primary hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
