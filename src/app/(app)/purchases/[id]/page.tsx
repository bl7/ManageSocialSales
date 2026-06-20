import Link from "next/link";
import { notFound } from "next/navigation";
import { getPurchaseById, getPurchaseItems } from "@/lib/queries/purchases";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PurchaseDetailPage({ params }: Props) {
  const { id } = await params;
  const [purchase, items, settings] = await Promise.all([
    getPurchaseById(id),
    getPurchaseItems(id),
    getSettings(),
  ]);

  if (!purchase) notFound();

  const currency = settings?.currency ?? "Rs.";
  const p = purchase as Record<string, unknown>;

  return (
    <div>
      <PageHeader title={`Purchase — ${formatDate(p.purchase_date as string)}`}>
        <Link href="/purchases"><Button variant="outline">Back</Button></Link>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3 text-sm">
        <div><span className="text-muted">Supplier:</span> {(p.party_name as string) || (p.supplier as string) || "—"}</div>
        <div><span className="text-muted">Total:</span> {formatCurrency(p.total_amount as string, currency)}</div>
        <div><span className="text-muted">Status:</span> <span className="capitalize">{p.payment_status as string}</span></div>
      </div>

      <DataTable>
        <DataTableHead>
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Color</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Unit Cost</th>
            <th className="px-4 py-3">Line Total</th>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {items.map((item: Record<string, unknown>) => (
            <tr key={item.id as string}>
              <td className="px-4 py-3">{item.product_name as string}</td>
              <td className="px-4 py-3">{item.size as string}</td>
              <td className="px-4 py-3">{item.color as string}</td>
              <td className="px-4 py-3">{item.quantity as number}</td>
              <td className="px-4 py-3">{formatCurrency(item.unit_cost as string, currency)}</td>
              <td className="px-4 py-3">{formatCurrency(item.line_total as string, currency)}</td>
            </tr>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
