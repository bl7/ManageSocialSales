import Link from "next/link";
import { getSalesSummary, getSalesList } from "@/lib/queries/sales";
import { getSettings } from "@/lib/queries/dashboard";
import { getDateRange } from "@/lib/date-ranges";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesSummaryCards } from "@/components/sales/sales-summary-cards";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; preset?: string; range?: string }>;
}

function resolveDates(params: { dateFrom?: string; dateTo?: string; preset?: string; range?: string }) {
  if (params.range === "all") return { from: undefined, to: undefined };
  if (params.preset) {
    const range = getDateRange(params.preset);
    if (range) return { from: range.from, to: range.to };
  }
  if (params.dateFrom && params.dateTo) {
    return { from: params.dateFrom, to: params.dateTo };
  }
  return { from: undefined, to: undefined };
}

export default async function SalesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { from: dateFrom, to: dateTo } = resolveDates(params);

  const [summary, sales, settings] = await Promise.all([
    getSalesSummary(dateFrom, dateTo),
    getSalesList(dateFrom, dateTo),
    getSettings(),
  ]);

  const currency = settings?.currency ?? "Rs.";

  return (
    <div>
      <PageHeader title="Sales" description="Revenue and profit by period">
        <Link href="/sales/new"><Button>Record Sale</Button></Link>
      </PageHeader>

      <SalesFilters dateFrom={dateFrom} dateTo={dateTo} />
      <SalesSummaryCards summary={summary} currency={currency} />

      {sales.length === 0 ? (
        <EmptyState
          message="No sales in this period."
          actionLabel="Record a sale"
          actionHref="/sales/new"
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Units</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Est. Profit</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.sale_date)}</td>
                <td className="px-4 py-3">{s.platform || "—"}</td>
                <td className="px-4 py-3">{s.item_count}</td>
                <td className="px-4 py-3">{s.units}</td>
                <td className="px-4 py-3 font-medium">{formatCurrency(s.revenue, currency)}</td>
                <td className="px-4 py-3 font-medium text-primary">
                  {formatCurrency(s.estimated_profit, currency)}
                </td>
                <td className="px-4 py-3 text-muted max-w-[200px] truncate">{s.notes || "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/sales/${s.id}`} className="text-sm text-primary hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
