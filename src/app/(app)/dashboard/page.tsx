import Link from "next/link";
import { getDashboardStats, getSettings } from "@/lib/queries/dashboard";
import { getTotalAccountBalance, getCashflowChartData } from "@/lib/queries/accounts";
import { getLowStockReport } from "@/lib/queries/reports";
import { getRecentActivity } from "@/lib/queries/dashboard-charts";
import { PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { DashboardHomeTiles } from "@/components/dashboard/dashboard-home-tiles";
import { DashboardShortcuts } from "@/components/dashboard/dashboard-shortcuts";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Scale } from "lucide-react";

export default async function DashboardPage() {
  const [stats, settings, totalBalance, cashflow, activity, lowStock] = await Promise.all([
    getDashboardStats(),
    getSettings(),
    getTotalAccountBalance(),
    getCashflowChartData(7),
    getRecentActivity(8),
    getLowStockReport(),
  ]);

  const currency = settings?.currency ?? stats.currency ?? "Rs.";
  const monthLabel = new Date().toLocaleString("default", { month: "long" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-8">
      <PageHeader title={greeting} description="Your business at a glance">
        <Link href="/transactions">
          <Button variant="outline">View Transactions</Button>
        </Link>
      </PageHeader>

      <DashboardHomeTiles
        stats={{
          total_receivables: stats.total_receivables,
          total_payables: stats.total_payables,
          revenue_this_month: stats.revenue_this_month,
          purchases_this_month: stats.purchases_this_month,
          expenses_this_month: stats.expenses_this_month,
          total_balance: totalBalance,
          currency,
        }}
        monthLabel={monthLabel}
      />

      <DashboardShortcuts />

      <CashflowChart data={cashflow} currency={currency} />

      <section>
        <h2 className="mb-4 text-xl font-semibold">Inventory Attention Required</h2>
        {lowStock.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted">
            Great news. No low-stock variants need attention right now.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.slice(0, 6).map((item) => (
              <div
                key={`${item.product_name}-${item.size}-${item.color}`}
                className="rounded-2xl border border-amber-200 bg-card p-5"
              >
                <p className="font-semibold">{item.product_name}</p>
                <p className="text-sm text-muted">{item.color} / {item.size}</p>
                <p className="mt-3 text-sm font-medium text-warning">Only {item.current_stock} left</p>
                <Link href="/purchases/new" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">Record Purchase</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Stock Activity</h2>
          <Link href="/stock-corrections/new">
            <Button variant="outline" size="sm">
              <Scale className="mr-2 h-4 w-4" />
              Stock Correction
            </Button>
          </Link>
        </div>
        <RecentActivity entries={activity} />
      </section>
    </div>
  );
}
