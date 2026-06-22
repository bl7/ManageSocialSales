import Link from "next/link";
import { getPurchasesSummary, getPurchasesList } from "@/lib/queries/purchases";
import { getSettings } from "@/lib/queries/dashboard";
import { resolveListDateRange } from "@/lib/date-ranges";
import { PageHeader, EmptyState, ListPage, ListFilterBar } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { PeriodFilters } from "@/components/ui/period-filters";
import { PurchasesSummaryCards } from "@/components/purchases/purchases-summary-cards";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { getDateFormatters, getDateCalendar } from "@/lib/date-preference.server";

interface Props {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; preset?: string }>;
}

function resolveDates(
  params: { dateFrom?: string; dateTo?: string; preset?: string },
  calendar: "AD" | "BS"
) {
  return resolveListDateRange(params, { dateCalendar: calendar });
}

export default async function PurchasesPage({ searchParams }: Props) {
  const params = await searchParams;
  const calendar = await getDateCalendar();
  const { formatDate } = await getDateFormatters();
  const { from: dateFrom, to: dateTo } = resolveDates(params, calendar);
  const [summary, purchases, settings] = await Promise.all([
    getPurchasesSummary(dateFrom, dateTo),
    getPurchasesList(dateFrom, dateTo),
    getSettings(),
  ]);

  const currency = settings?.currency ?? "Rs.";

  return (
    <ListPage>
      <PageHeader title="Purchases" description="Incoming stock by period">
        <Link href="/purchases/new"><Button>Record Purchase</Button></Link>
      </PageHeader>

      <ListFilterBar>
        <PeriodFilters dateFrom={dateFrom ?? ""} dateTo={dateTo ?? ""} />
      </ListFilterBar>

      <PurchasesSummaryCards summary={summary} currency={currency} />

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
              <tr
                key={p.id as string}
                className={`hover:bg-slate-50 ${p.status === "voided" ? "opacity-60" : ""}`}
              >
                <td className="px-4 py-3">
                  {formatDate(p.purchase_date as string)}
                  {p.status === "voided" && (
                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">voided</span>
                  )}
                </td>
                <td className="px-4 py-3">{(p.party_name as string) || (p.supplier as string) || "—"}</td>
                <td className="px-4 py-3">{p.item_count as number}</td>
                <td className="px-4 py-3">{formatCurrency(p.total_amount as string, currency)}</td>
                <td className="px-4 py-3">{formatCurrency(p.amount_paid as string, currency)}</td>
                <td className="px-4 py-3 capitalize">
                  {p.status === "voided" ? "voided" : (p.payment_status as string)}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/purchases/${p.id as string}`} className="text-sm text-primary hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </ListPage>
  );
}
