import Link from "next/link";
import { Suspense } from "react";
import { getInvestmentSummary } from "@/lib/queries/investments";
import { getInvestors } from "@/lib/queries/investors";
import { getSettings } from "@/lib/queries/dashboard";
import { getAccounts } from "@/lib/queries/accounts";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { InvestmentForm } from "@/components/forms/investment-form";
import { InvestorForm } from "@/components/forms/investor-form";
import { InvestmentTabs } from "@/components/investment/investment-tabs";
import { DeleteInvestorButton } from "@/components/investment/delete-investor-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getInvestorById } from "@/lib/queries/investors";

interface Props {
  searchParams: Promise<{ new?: string; tab?: string; edit?: string }>;
}

export default async function InvestmentPage({ searchParams }: Props) {
  const params = await searchParams;

  if (params.new === "1") {
    const [accounts, investors, settings] = await Promise.all([
      getAccounts(),
      getInvestors(),
      getSettings(),
    ]);
    return (
      <InvestmentForm
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        investors={investors.map((i) => ({ id: i.id, name: i.name }))}
        currency={settings?.currency ?? "Rs."}
      />
    );
  }

  if (params.new === "investor") {
    return <InvestorForm />;
  }

  if (params.edit) {
    const investor = await getInvestorById(params.edit);
    if (!investor) {
      return (
        <PageHeader title="Investor not found">
          <Link href="/investment?tab=investors"><Button variant="outline">Back</Button></Link>
        </PageHeader>
      );
    }
    return <InvestorForm investor={investor} />;
  }

  const [summary, settings] = await Promise.all([
    getInvestmentSummary(),
    getSettings(),
  ]);

  const currency = settings?.currency ?? "Rs.";
  const tab = params.tab ?? "overview";

  return (
    <div>
      <PageHeader title="Investment & Returns" description="Capital, ownership, and profit tracking">
        <div className="flex flex-wrap gap-2">
          {tab === "investors" ? (
            <Link href="/investment?new=investor"><Button>Add Investor</Button></Link>
          ) : (
            <Link href="/investment?new=1"><Button>Add Investment</Button></Link>
          )}
          <Link href="/transactions?withdraw=1">
            <Button variant="outline">Withdraw Profit</Button>
          </Link>
        </div>
      </PageHeader>

      <Suspense fallback={null}>
        <InvestmentTabs />
      </Suspense>

      {tab === "investors" ? (
        <>
          {summary.byInvestor.length === 0 ? (
            <EmptyState
              message="No investors yet. Add investors before recording investments."
              actionLabel="Add Investor"
              actionHref="/investment?new=investor"
            />
          ) : (
            <DataTable>
              <DataTableHead>
                <tr>
                  <th className="px-4 py-3">Investor</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-right">Invested</th>
                  <th className="px-4 py-3 text-right">Ownership</th>
                  <th className="px-4 py-3 text-right">Withdrawn</th>
                  <th className="px-4 py-3 text-right">Entries</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {summary.byInvestor.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-medium">{inv.name}</td>
                    <td className="px-4 py-3 text-sm text-muted">{inv.phone || inv.email || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(inv.total_invested, currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-primary">
                      {summary.totalInvested > 0 ? `${inv.ownership_pct.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {formatCurrency(inv.total_withdrawn, currency)}
                    </td>
                    <td className="px-4 py-3 text-right">{inv.investment_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/investment?edit=${inv.id}`}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </Link>
                        {inv.investment_count === 0 && (
                          <DeleteInvestorButton investorId={inv.id} name={inv.name} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase text-muted">Investment vs Earnings</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-primary/30 bg-gradient-to-br from-teal-50/80 to-white shadow-none">
                <CardTitle>Total Invested</CardTitle>
                <CardValue className="text-primary">{formatCurrency(summary.totalInvested, currency)}</CardValue>
              </Card>
              <Card className="shadow-none">
                <CardTitle>Net Profit</CardTitle>
                <CardValue className={summary.netProfit >= 0 ? "text-success" : "text-danger"}>
                  {formatCurrency(summary.netProfit, currency)}
                </CardValue>
              </Card>
              <Card className="shadow-none">
                <CardTitle>Profit Withdrawn</CardTitle>
                <CardValue className="text-danger">{formatCurrency(summary.totalWithdrawn, currency)}</CardValue>
              </Card>
              <Card className="shadow-none">
                <CardTitle>ROI</CardTitle>
                <CardValue className={summary.roi >= 0 ? "text-success" : "text-danger"}>
                  {summary.totalInvested > 0 ? `${summary.roi.toFixed(1)}%` : "—"}
                </CardValue>
              </Card>
            </div>
          </div>

          {summary.byInvestor.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 text-lg font-semibold">Ownership Split</h3>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <th className="px-4 py-3">Investor</th>
                    <th className="px-4 py-3 text-right">Invested</th>
                    <th className="px-4 py-3 text-right">Company Share</th>
                    <th className="px-4 py-3 text-right">Est. Profit Share</th>
                    <th className="px-4 py-3 text-right">Withdrawn</th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {summary.byInvestor.map((inv) => {
                    const profitShare = summary.netProfit * (inv.ownership_pct / 100);
                    return (
                      <tr key={inv.id}>
                        <td className="px-4 py-3 font-medium">{inv.name}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(inv.total_invested, currency)}</td>
                        <td className="px-4 py-3 text-right font-medium text-primary">
                          {inv.ownership_pct.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(profitShare, currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted">
                          {formatCurrency(inv.total_withdrawn, currency)}
                        </td>
                      </tr>
                    );
                  })}
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
                  <th className="px-4 py-3">Accounts</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3"></th>
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
                    <td className="px-4 py-3 text-sm text-muted">
                      {inv.allocation_summary || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{inv.notes || "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/investment/${inv.id}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </>
      )}
    </div>
  );
}
