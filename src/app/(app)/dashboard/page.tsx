import Link from "next/link";
import {
  getDashboardStats,
  getSettings,
} from "@/lib/queries/dashboard";
import { getLowStockReport } from "@/lib/queries/reports";
import {
  getSalesChartData,
  getPlatformChartData,
  getRecentActivity,
} from "@/lib/queries/dashboard-charts";
import { PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { StatCards } from "@/components/dashboard/stat-cards";
import { SalesChart, PlatformChart } from "@/components/dashboard/dashboard-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Plus, PackagePlus, ShoppingCart, Scale } from "lucide-react";

export default async function DashboardPage() {
  const [stats, salesChart, platformChart, activity, settings, lowStock] = await Promise.all([
    getDashboardStats(),
    getSalesChartData(30),
    getPlatformChartData(),
    getRecentActivity(8),
    getSettings(),
    getLowStockReport(),
  ]);

  const currency = settings?.currency ?? "Rs.";

  const salesData = salesChart.map((r) => ({
    date: r.date,
    revenue: Number(r.revenue),
    units: Number(r.units),
  }));

  const platformData = platformChart.map((r) => ({
    platform: r.platform,
    revenue: Number(r.revenue),
    count: Number(r.count),
  }));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6">
      <PageHeader title={greeting} description="Here's what's happening in your business today." />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/sales/new" className="sm:col-span-2 lg:col-span-1">
          <Button size="lg" className="h-14 w-full text-base shadow-md">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Record Sale
          </Button>
        </Link>
        <Link href="/purchases/new">
          <Button size="lg" variant="outline" className="h-14 w-full">
            <PackagePlus className="mr-2 h-5 w-5" />
            Record Purchase
          </Button>
        </Link>
        <Link href="/products/new">
          <Button size="lg" variant="outline" className="h-14 w-full">
            <Plus className="mr-2 h-5 w-5" />
            Add Product
          </Button>
        </Link>
        <Link href="/stock-corrections/new">
          <Button size="lg" variant="outline" className="h-14 w-full">
            <Scale className="mr-2 h-5 w-5" />
            Stock Correction
          </Button>
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Business Snapshot</h2>
        <StatCards stats={{ ...stats, currency }} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SalesChart data={salesData} currency={currency} />
        <PlatformChart data={platformData} currency={currency} />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Inventory Attention Required</h2>
        {lowStock.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted">
            Great news. No low-stock variants need attention right now.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.slice(0, 6).map((item) => (
              <div key={`${item.product_name}-${item.size}-${item.color}`} className="rounded-2xl border border-amber-200 bg-card p-5">
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

      <div className="mt-8">
        <RecentActivity entries={activity} />
      </div>
    </div>
  );
}
