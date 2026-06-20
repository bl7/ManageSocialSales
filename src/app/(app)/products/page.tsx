import Link from "next/link";
import {
  getProductsWithVariants,
  getCategories,
  getSizes,
  getColors,
} from "@/lib/queries/products";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Props {
  searchParams: Promise<{
    search?: string;
    category?: string;
    size?: string;
    color?: string;
    stockStatus?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [products, categories, sizes, colors, settings] = await Promise.all([
    getProductsWithVariants(params),
    getCategories(),
    getSizes(),
    getColors(),
    getSettings(),
  ]);
  const currency = settings?.currency ?? "$";

  return (
    <div>
      <PageHeader title="Products" description="All products and variants">
        <Link href="/products/new"><Button>Add Product</Button></Link>
      </PageHeader>

      <form className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input name="search" placeholder="Search name, SKU..." defaultValue={params.search}
          className="h-10 rounded-lg border border-border px-3 text-sm" />
        <select name="category" defaultValue={params.category || ""}
          className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="size" defaultValue={params.size || ""}
          className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="">All Sizes</option>
          {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="color" defaultValue={params.color || ""}
          className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="">All Colors</option>
          {colors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="stockStatus" defaultValue={params.stockStatus || ""}
          className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="">All Stock Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <Button type="submit" className="sm:col-span-2 lg:col-span-5">Apply Filters</Button>
      </form>

      {products.length === 0 ? (
        <EmptyState message="No products found. Add your first product to get started." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Purchased</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.product_id}`} className="font-medium text-primary hover:underline">
                      {p.product_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.sku || "—"}</td>
                  <td className="px-4 py-3">{p.category || "—"}</td>
                  <td className="px-4 py-3">{p.size}</td>
                  <td className="px-4 py-3">{p.color}</td>
                  <td className="px-4 py-3">{formatCurrency(p.default_cost_price, currency)}</td>
                  <td className="px-4 py-3">{formatCurrency(p.default_selling_price, currency)}</td>
                  <td className="px-4 py-3">{p.purchased_qty}</td>
                  <td className="px-4 py-3">{p.sold_qty}</td>
                  <td className="px-4 py-3 font-medium">{p.current_stock}</td>
                  <td className="px-4 py-3"><StockBadge status={p.stock_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
