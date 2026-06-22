import Link from "next/link";
import {
  getProductsWithVariants,
  getSizes,
  getColors,
} from "@/lib/queries/products";
import { getProductCategories } from "@/lib/queries/categories";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/export/export-button";
import { StockBadge } from "@/components/ui/badge";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";

interface Props {
  searchParams: Promise<{
    search?: string;
    category?: string;
    size?: string;
    color?: string;
    stockStatus?: string;
    view?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [products, categories, sizes, colors, settings] = await Promise.all([
    getProductsWithVariants(params),
    getProductCategories(),
    getSizes(),
    getColors(),
    getSettings(),
  ]);
  const currency = settings?.currency ?? "Rs.";
  const view = params.view === "card" ? "card" : "table";

  return (
    <div>
      <PageHeader title="Products" description="All products and variants">
        <Link href={view === "table" ? "/products?view=card" : "/products"}>
          <Button variant="outline">{view === "table" ? "Card View" : "Table View"}</Button>
        </Link>
        <ExportButton href="/api/export/products" />
        <Link href="/products/new"><Button>Add Product</Button></Link>
      </PageHeader>

      <form className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input name="search" placeholder="Search name, SKU..." defaultValue={params.search}
          className="h-10 rounded-lg border border-border px-3 text-sm" />
        <select name="category" defaultValue={params.category || ""}
          className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
        <EmptyState
          message="No products found. Add your first product to get started."
          actionLabel="Add Product"
          actionHref="/products/new"
        />
      ) : (
        <>
        {view === "card" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/products/${p.product_id}`} className="font-semibold text-primary hover:underline">
                      {p.product_name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">{p.category || "Uncategorized"} · SKU: {p.sku || "—"}</p>
                  </div>
                  <StockBadge status={p.stock_status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted">Variant</p><p>{p.color} / {p.size}</p></div>
                  <div><p className="text-xs text-muted">Stock</p><p className="font-medium">{p.current_stock}</p></div>
                  <div><p className="text-xs text-muted">Cost</p><p>{formatCurrency(p.default_cost_price, currency)}</p></div>
                  <div><p className="text-xs text-muted">Price</p><p>{formatCurrency(p.default_selling_price, currency)}</p></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/pos/new?product=${p.product_id}`}><Button size="sm">POS</Button></Link>
                  <Link href={`/purchases/new?product=${p.product_id}`}><Button size="sm" variant="outline">Purchase</Button></Link>
                  <Link href={`/products/${p.product_id}`}><Button size="sm" variant="ghost">View</Button></Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <DataTable>
          <DataTableHead>
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
          </DataTableHead>
          <DataTableBody>
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
          </DataTableBody>
        </DataTable>
        )}
        </>
      )}
    </div>
  );
}
