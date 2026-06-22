import Link from "next/link";
import { getSalesSummary, getSalesList } from "@/lib/queries/sales";
import { getSettings } from "@/lib/queries/dashboard";
import { resolveListDateRange } from "@/lib/date-ranges";
import { PageHeader, EmptyState, ListPage, ListFilterBar } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesSummaryCards } from "@/components/sales/sales-summary-cards";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { getDateFormatters, getDateCalendar } from "@/lib/date-preference.server";

interface Props {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; preset?: string; range?: string }>;
}

function resolveDates(
  params: { dateFrom?: string; dateTo?: string; preset?: string; range?: string },
  calendar: "AD" | "BS"
) {
  return resolveListDateRange(params, { allowAll: true, dateCalendar: calendar });
}

export default async function SalesPage({ searchParams }: Props) {
  const params = await searchParams;
  const calendar = await getDateCalendar();
  const { formatDate } = await getDateFormatters();
  const { from: dateFrom, to: dateTo } = resolveDates(params, calendar);

  const [summary, sales, settings] = await Promise.all([
    getSalesSummary(dateFrom, dateTo),
    getSalesList(dateFrom, dateTo),
    getSettings(),
  ]);

  const currency = settings?.currency ?? "Rs.";

  return (
    <ListPage>
      <PageHeader title="Sales" description="Revenue and profit by period">
        <Link href="/pos/new"><Button>POS</Button></Link>
      </PageHeader>

      <ListFilterBar>
        <SalesFilters dateFrom={dateFrom} dateTo={dateTo} />
      </ListFilterBar>

      <SalesSummaryCards summary={summary} currency={currency} />

      {sales.length === 0 ? (
        <EmptyState
          message="No sales in this period."
          actionLabel="Open POS"
          actionHref="/pos/new"
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
              <tr key={s.id} className={`hover:bg-slate-50 ${s.status === "voided" ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(s.sale_date)}
                  {s.status === "voided" && (
                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">voided</span>
                  )}
                </td>
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
    </ListPage>
  );
}
