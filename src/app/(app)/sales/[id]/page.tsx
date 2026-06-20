import Link from "next/link";
import { notFound } from "next/navigation";
import { getSaleById, getSaleItems } from "@/lib/queries/sales";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: Props) {
  const { id } = await params;
  const [sale, items, settings] = await Promise.all([
    getSaleById(id),
    getSaleItems(id),
    getSettings(),
  ]);

  if (!sale) notFound();

  const currency = settings?.currency ?? "Rs.";
  const s = sale as Record<string, unknown>;
  const subtotal = items.reduce((sum, i) => sum + Number(i.line_total), 0);
  const deliveryCharge = Number(s.delivery_charge ?? 0);
  const revenue = Number(s.total_amount ?? subtotal + deliveryCharge);
  const profit = items.reduce((sum, i) => sum + Number(i.estimated_profit), 0);
  const units = items.reduce((sum, i) => sum + i.quantity, 0);
  const creditDue = Math.max(0, Number(s.total_amount) - Number(s.amount_paid ?? s.total_amount));

  return (
    <div>
      <PageHeader
        title={`Sale — ${formatDate(s.sale_date as string)}`}
        description={(s.invoice_number as string) || (s.platform as string) || undefined}
      >
        <Link href={`/sales/${id}/invoice`}><Button variant="outline">Invoice</Button></Link>
        <Link href="/sales"><Button variant="outline">Back to Sales</Button></Link>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardTitle>Customer</CardTitle>
          <CardValue className="text-lg">{(s.party_name as string) || "Walk-in"}</CardValue>
        </Card>
        <Card>
          <CardTitle>Payment</CardTitle>
          <CardValue className="text-lg capitalize">{s.payment_status as string}</CardValue>
          {(s.payment_method_name as string) && (
            <p className="mt-1 text-xs text-muted">{s.payment_method_name as string}</p>
          )}
          {creditDue > 0 && (
            <p className="mt-1 text-xs text-warning">Due: {formatCurrency(creditDue, currency)}</p>
          )}
        </Card>
        <Card>
          <CardTitle>Units</CardTitle>
          <CardValue>{units}</CardValue>
        </Card>
        <Card className="border-primary/30 bg-gradient-to-br from-teal-50/80 to-white">
          <CardTitle>Revenue</CardTitle>
          <CardValue className="text-primary">{formatCurrency(revenue, currency)}</CardValue>
        </Card>
        <Card className="border-primary/30 bg-gradient-to-br from-teal-50/80 to-white">
          <CardTitle>Est. Profit</CardTitle>
          <CardValue className="text-primary">{formatCurrency(profit, currency)}</CardValue>
        </Card>
      </div>

      {Boolean(s.notes || s.created_at) && (
        <Card className="mb-6">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Platform</dt>
              <dd>{(s.platform as string) || "—"}</dd>
            </div>
            {deliveryCharge > 0 && (
              <div>
                <dt className="text-muted">Delivery Charge</dt>
                <dd>{formatCurrency(deliveryCharge, currency)}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Recorded</dt>
              <dd>{formatDateTime(s.created_at as string)}</dd>
            </div>
            {Boolean(s.notes) && (
              <div className="sm:col-span-2">
                <dt className="text-muted">Notes</dt>
                <dd>{s.notes as string}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <h3 className="mb-3 text-lg font-semibold">Line Items</h3>
      <DataTable>
        <DataTableHead>
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Color</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Unit Price</th>
            <th className="px-4 py-3">Revenue</th>
            <th className="px-4 py-3">Est. Profit</th>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-medium">{item.product_name}</td>
              <td className="px-4 py-3">{item.size}</td>
              <td className="px-4 py-3">{item.color}</td>
              <td className="px-4 py-3">{item.quantity}</td>
              <td className="px-4 py-3">{formatCurrency(item.unit_sale_price, currency)}</td>
              <td className="px-4 py-3">{formatCurrency(item.line_total, currency)}</td>
              <td className="px-4 py-3 text-primary">{formatCurrency(item.estimated_profit, currency)}</td>
            </tr>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
