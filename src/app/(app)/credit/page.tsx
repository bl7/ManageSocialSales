import Link from "next/link";
import {
  getTotalReceivables,
  getTotalPayables,
  getOutstandingReceivables,
  getOutstandingPayables,
} from "@/lib/queries/parties";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";

export default async function CreditPage() {
  const [toCollect, toPay, receivables, payables, settings] = await Promise.all([
    getTotalReceivables(),
    getTotalPayables(),
    getOutstandingReceivables(),
    getOutstandingPayables(),
    getSettings(),
  ]);

  const currency = settings?.currency ?? "Rs.";
  const netPosition = toCollect - toPay;

  return (
    <div>
      <PageHeader
        title="Credit Summary"
        description="Current amounts to collect and pay — always live"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/30 bg-gradient-to-br from-teal-50/80 to-white">
          <CardTitle>To Collect</CardTitle>
          <CardValue className="text-primary">{formatCurrency(toCollect, currency)}</CardValue>
          <p className="mt-1 text-xs text-muted">From customers (udhar)</p>
        </Card>
        <Card className="border-warning/30 bg-gradient-to-br from-amber-50/80 to-white">
          <CardTitle>To Pay</CardTitle>
          <CardValue className="text-warning">{formatCurrency(toPay, currency)}</CardValue>
          <p className="mt-1 text-xs text-muted">To suppliers (credit)</p>
        </Card>
        <Card>
          <CardTitle>Net Position</CardTitle>
          <CardValue className={netPosition >= 0 ? "text-success" : "text-danger"}>
            {formatCurrency(netPosition, currency)}
          </CardValue>
          <p className="mt-1 text-xs text-muted">
            {netPosition >= 0 ? "More to collect than pay" : "More to pay than collect"}
          </p>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-lg font-semibold">To Collect from Customers</h3>
          {receivables.length === 0 ? (
            <EmptyState message="No outstanding customer balances." />
          ) : (
            <DataTable>
              <DataTableHead>
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {receivables.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted">{p.phone || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-primary">
                      {formatCurrency(p.current_balance, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/parties/${p.id}`} className="text-sm text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">To Pay to Suppliers</h3>
          {payables.length === 0 ? (
            <EmptyState message="No outstanding supplier balances." />
          ) : (
            <DataTable>
              <DataTableHead>
                <tr>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {payables.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted">{p.phone || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-warning">
                      {formatCurrency(p.current_balance, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/parties/${p.id}`} className="text-sm text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </div>
      </div>
    </div>
  );
}
