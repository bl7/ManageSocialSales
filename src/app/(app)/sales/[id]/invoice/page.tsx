import { notFound } from "next/navigation";
import Link from "next/link";
import { getSaleById, getSaleItems } from "@/lib/queries/sales";
import { getSettings } from "@/lib/queries/dashboard";
import { PrintButton } from "@/components/sales/print-button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: Props) {
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
  const total = Number(s.total_amount ?? subtotal + deliveryCharge);

  return (
    <>
      <div className="mb-4 flex gap-3 print:hidden">
        <Link href={`/sales/${id}`} className="text-sm text-primary hover:underline">← Back to sale</Link>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 print:border-0 print:shadow-none">
        <div className="mb-8 flex items-start justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">{settings?.business_name || "Shree Inventory"}</h1>
            {settings?.address && <p className="mt-1 text-sm text-muted">{settings.address}</p>}
            {settings?.phone && <p className="text-sm text-muted">{settings.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">INVOICE</p>
            <p className="text-sm font-medium">{s.invoice_number as string}</p>
            <p className="text-sm text-muted">{formatDate(s.sale_date as string)}</p>
          </div>
        </div>

        {Boolean(s.party_name) && (
          <div className="mb-6">
            <p className="text-xs uppercase text-muted">Bill To</p>
            <p className="font-medium">{s.party_name as string}</p>
          </div>
        )}

        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-2">{item.product_name} ({item.size}/{item.color})</td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(item.unit_sale_price, currency)}</td>
                <td className="py-2 text-right">{formatCurrency(item.line_total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-border pt-4 text-right space-y-1">
          <p className="text-sm text-muted">Subtotal: {formatCurrency(subtotal, currency)}</p>
          {deliveryCharge > 0 && (
            <p className="text-sm text-muted">Delivery: {formatCurrency(deliveryCharge, currency)}</p>
          )}
          <p className="text-lg font-bold">Total: {formatCurrency(total, currency)}</p>
          {(s.payment_method_name as string) && (
            <p className="text-sm text-muted">Method: {s.payment_method_name as string}</p>
          )}
          <p className="text-sm text-muted capitalize">Status: {s.payment_status as string}</p>
          {Number(s.amount_paid) < Number(s.total_amount) && (
            <p className="text-sm font-medium text-warning">
              Due: {formatCurrency(Number(s.total_amount) - Number(s.amount_paid), currency)}
              {s.due_date ? ` by ${formatDate(s.due_date as string)}` : ""}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
