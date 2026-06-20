import Link from "next/link";
import { getPurchasesSummary, getPurchasesList } from "@/lib/queries/purchases";
import { getSettings } from "@/lib/queries/dashboard";
import { getDateRange, toISODate } from "@/lib/date-ranges";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { PeriodFilters } from "@/components/ui/period-filters";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; preset?: string }>;
}

function resolveDates(params: { dateFrom?: string; dateTo?: string; preset?: string }) {
  if (params.preset) {
    const range = getDateRange(params.preset);
    if (range) return range;
  }
  if (params.dateFrom && params.dateTo) return { from: params.dateFrom, to: params.dateTo };
  const today = toISODate(new Date());
  return { from: today, to: today };
}

export default async function PurchasesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { from: dateFrom, to: dateTo } = resolveDates(params);

  const [summary, purchases, settings] = await Promise.all([
    getPurchasesSummary(dateFrom, dateTo),
    getPurchasesList(dateFrom, dateTo),
    getSettings(),
  ]);

  const currency = settings?.currency ?? "Rs.";

  return (
    <div>
      <PageHeader title="Purchases" description="Incoming stock by period">
        <Link href="/purchases/new"><Button>Record Purchase</Button></Link>
      </PageHeader>

      <PeriodFilters dateFrom={dateFrom} dateTo={dateTo} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle>Purchases</CardTitle>
          <CardValue>{summary.purchase_count}</CardValue>
        </Card>
        <Card>
          <CardTitle>Total Cost</CardTitle>
          <CardValue>{formatCurrency(summary.total, currency)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Credit Due</CardTitle>
          <CardValue className="text-warning">{formatCurrency(summary.credit_due, currency)}</CardValue>
        </Card>
      </div>

      {purchases.length === 0 ? (
        <EmptyState message="No purchases in this period." actionLabel="Record Purchase" actionHref="/purchases/new" />
      ) : (
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {purchases.map((p: Record<string, unknown>) => (
              <tr key={p.id as string} className="hover:bg-slate-50">
                <td className="px-4 py-3">{formatDate(p.purchase_date as string)}</td>
                <td className="px-4 py-3">{(p.party_name as string) || (p.supplier as string) || "—"}</td>
                <td className="px-4 py-3">{p.item_count as number}</td>
                <td className="px-4 py-3">{formatCurrency(p.total_amount as string, currency)}</td>
                <td className="px-4 py-3">{formatCurrency(p.amount_paid as string, currency)}</td>
                <td className="px-4 py-3 capitalize">{p.payment_status as string}</td>
                <td className="px-4 py-3">
                  <Link href={`/purchases/${p.id as string}`} className="text-sm text-primary hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
