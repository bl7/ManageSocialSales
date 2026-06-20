import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductById,
  getProductVariants,
} from "@/lib/queries/products";
import { getProductLedger } from "@/lib/queries/ledger";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { StockBadge, MovementBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const [product, variants, ledger, settings] = await Promise.all([
    getProductById(id),
    getProductVariants(id),
    getProductLedger(id),
    getSettings(),
  ]);

  if (!product) notFound();

  const currency = settings?.currency ?? "$";
  const p = product as Record<string, unknown>;

  return (
    <div>
      <PageHeader title={p.name as string} description={p.sku ? `SKU: ${p.sku}` : undefined}>
        <Link href={`/products/${id}/edit`}><Button variant="outline">Edit Product</Button></Link>
        <Link href={`/purchases/new?product=${id}`}><Button variant="outline">Record Purchase</Button></Link>
        <Link href={`/sales/new?product=${id}`}><Button>Record Sale</Button></Link>
        <Link href={`/adjustments/new?product=${id}`}><Button variant="outline">Stock Adjustment</Button></Link>
      </PageHeader>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold">Product Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Category</dt><dd>{(p.category as string) || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Brand</dt><dd>{(p.brand as string) || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Supplier</dt><dd>{(p.supplier as string) || "—"}</dd></div>
            {(p.description as string) && (
              <div><dt className="text-muted">Description</dt><dd className="mt-1">{p.description as string}</dd></div>
            )}
          </dl>
        </Card>
      </div>

      <h3 className="mb-3 text-lg font-semibold">Variants</h3>
      {variants.length === 0 ? (
        <EmptyState message="No variants yet." />
      ) : (
        <div className="mb-8 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Reorder</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3">{v.size}</td>
                  <td className="px-4 py-3">{v.color}</td>
                  <td className="px-4 py-3">{formatCurrency(v.default_cost_price, currency)}</td>
                  <td className="px-4 py-3">{formatCurrency(v.default_selling_price, currency)}</td>
                  <td className="px-4 py-3 font-medium">{v.current_stock}</td>
                  <td className="px-4 py-3">{v.reorder_level}</td>
                  <td className="px-4 py-3"><StockBadge status={v.stock_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="mb-3 text-lg font-semibold">Recent Stock Movements</h3>
      {ledger.length === 0 ? (
        <EmptyState message="No stock movements recorded yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">Stock After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledger.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3">{formatDateTime(entry.created_at)}</td>
                  <td className="px-4 py-3">{entry.size}</td>
                  <td className="px-4 py-3">{entry.color}</td>
                  <td className="px-4 py-3"><MovementBadge type={entry.movement_type} /></td>
                  <td className={`px-4 py-3 font-medium ${entry.quantity_change > 0 ? "text-success" : "text-danger"}`}>
                    {entry.quantity_change > 0 ? "+" : ""}{entry.quantity_change}
                  </td>
                  <td className="px-4 py-3">{entry.stock_after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
