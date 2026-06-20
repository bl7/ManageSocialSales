import { getLedgerEntries } from "@/lib/queries/ledger";
import { query } from "@/lib/db";
import { T } from "@/lib/tables";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { MovementBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/export/export-button";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  searchParams: Promise<{
    productId?: string;
    size?: string;
    color?: string;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function LedgerPage({ searchParams }: Props) {
  const params = await searchParams;
  const [entries, products, settings] = await Promise.all([
    getLedgerEntries(params),
    query<{ id: string; name: string }>(`SELECT id, name FROM ${T.products} WHERE is_active = true ORDER BY name`),
    getSettings(),
  ]);
  const currency = settings?.currency ?? "$";

  return (
    <div>
      <PageHeader title="Stock Ledger" description="Complete history of all stock movements">
        <ExportButton href={`/api/export/ledger?${new URLSearchParams(params as Record<string, string>).toString()}`} />
      </PageHeader>

      <form className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <select name="productId" defaultValue={params.productId || ""}
          className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="">All Products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="size" placeholder="Size" defaultValue={params.size}
          className="h-10 rounded-lg border border-border px-3 text-sm" />
        <input name="color" placeholder="Color" defaultValue={params.color}
          className="h-10 rounded-lg border border-border px-3 text-sm" />
        <select name="movementType" defaultValue={params.movementType || ""}
          className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="sale">Sale</option>
          <option value="adjustment">Adjustment</option>
        </select>
        <input name="dateFrom" type="date" defaultValue={params.dateFrom}
          className="h-10 rounded-lg border border-border px-3 text-sm" />
        <input name="dateTo" type="date" defaultValue={params.dateTo}
          className="h-10 rounded-lg border border-border px-3 text-sm" />
        <Button type="submit" className="sm:col-span-2 lg:col-span-3">Apply Filters</Button>
      </form>

      {entries.length === 0 ? (
        <EmptyState message="No stock movements recorded yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Date/Time</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">Stock After</th>
                <th className="px-4 py-3">Unit Cost</th>
                <th className="px-4 py-3">Sale Price</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(e.created_at)}</td>
                  <td className="px-4 py-3">{e.product_name}</td>
                  <td className="px-4 py-3">{e.size}</td>
                  <td className="px-4 py-3">{e.color}</td>
                  <td className="px-4 py-3"><MovementBadge type={e.movement_type} /></td>
                  <td className={`px-4 py-3 font-medium ${e.quantity_change > 0 ? "text-success" : "text-danger"}`}>
                    {e.quantity_change > 0 ? "+" : ""}{e.quantity_change}
                  </td>
                  <td className="px-4 py-3 font-medium">{e.stock_after}</td>
                  <td className="px-4 py-3">{e.unit_cost ? formatCurrency(e.unit_cost, currency) : "—"}</td>
                  <td className="px-4 py-3">{e.unit_sale_price ? formatCurrency(e.unit_sale_price, currency) : "—"}</td>
                  <td className="px-4 py-3 text-muted">{e.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
