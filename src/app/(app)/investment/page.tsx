import Link from "next/link";
import { getInvestmentSummary } from "@/lib/queries/investments";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { InvestmentForm } from "@/components/forms/investment-form";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ new?: string }>;
}

export default async function InvestmentPage({ searchParams }: Props) {
  const params = await searchParams;

  if (params.new === "1") {
    return <InvestmentForm />;
  }

  const [summary, settings] = await Promise.all([
    getInvestmentSummary(),
    getSettings(),
  ]);

  const currency = settings?.currency ?? "Rs.";

  return (
    <div>
      <PageHeader title="Investment & Returns" description="Capital invested vs business earnings (all time)">
        <Link href="/investment?new=1"><Button>Add Investment</Button></Link>
      </PageHeader>

      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase text-muted">Investment vs Earnings</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/30 bg-gradient-to-br from-teal-50/80 to-white shadow-none">
            <CardTitle>Total Invested</CardTitle>
            <CardValue className="text-primary">{formatCurrency(summary.totalInvested, currency)}</CardValue>
          </Card>
          <Card className="shadow-none">
            <CardTitle>Total Revenue</CardTitle>
            <CardValue>{formatCurrency(summary.revenue, currency)}</CardValue>
            <p className="mt-1 text-xs text-muted">All sales</p>
          </Card>
          <Card className="shadow-none">
            <CardTitle>Est. Gross Profit</CardTitle>
            <CardValue>{formatCurrency(summary.grossProfit, currency)}</CardValue>
            <p className="mt-1 text-xs text-muted">Revenue minus default costs</p>
          </Card>
          <Card className="shadow-none">
            <CardTitle>Total Expenses</CardTitle>
            <CardValue className="text-danger">{formatCurrency(summary.expenses, currency)}</CardValue>
          </Card>
          <Card className="border-primary/30 bg-gradient-to-br from-teal-50/80 to-white shadow-none">
            <CardTitle>Net Profit</CardTitle>
            <CardValue className={summary.netProfit >= 0 ? "text-success" : "text-danger"}>
              {formatCurrency(summary.netProfit, currency)}
            </CardValue>
            <p className="mt-1 text-xs text-muted">Gross profit − expenses</p>
          </Card>
          <Card className="shadow-none">
            <CardTitle>Return on Investment</CardTitle>
            <CardValue className={summary.roi >= 0 ? "text-success" : "text-danger"}>
              {summary.totalInvested > 0 ? `${summary.roi.toFixed(1)}%` : "—"}
            </CardValue>
            <p className="mt-1 text-xs text-muted">Net profit ÷ total invested</p>
          </Card>
        </div>
        {summary.totalInvested > 0 && (
          <p className="mt-4 text-sm text-muted">
            On {formatCurrency(summary.totalInvested, currency)} invested, net earnings are{" "}
            <span className="font-medium text-foreground">{formatCurrency(summary.netProfit, currency)}</span>
            {summary.netProfit >= summary.totalInvested
              ? " — investment has been recovered."
              : summary.netProfit > 0
                ? ` — ${formatCurrency(summary.totalInvested - summary.netProfit, currency)} left to recover.`
                : "."}
          </p>
        )}
      </div>

      {summary.byInvestor.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-lg font-semibold">By Investor</h3>
          <DataTable>
            <DataTableHead>
              <tr>
                <th className="px-4 py-3">Investor</th>
                <th className="px-4 py-3">Entries</th>
                <th className="px-4 py-3 text-right">Total Invested</th>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {summary.byInvestor.map((inv) => (
                <tr key={inv.investor_name}>
                  <td className="px-4 py-3 font-medium">{inv.investor_name}</td>
                  <td className="px-4 py-3">{inv.count}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(inv.total, currency)}
                  </td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
        </div>
      )}

      <h3 className="mb-3 text-lg font-semibold">Investment History</h3>
      {summary.investments.length === 0 ? (
        <EmptyState
          message="No investments recorded yet."
          actionLabel="Add Investment"
          actionHref="/investment?new=1"
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Investor</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {summary.investments.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3">{formatDate(inv.investment_date)}</td>
                <td className="px-4 py-3 font-medium">{inv.investor_name}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(inv.amount, currency)}
                </td>
                <td className="px-4 py-3 text-muted">{inv.notes || "—"}</td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
