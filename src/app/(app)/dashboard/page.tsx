import Link from "next/link";
import {
  getDashboardStats,
  getSettings,
} from "@/lib/queries/dashboard";
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
  const [stats, salesChart, platformChart, activity, settings] = await Promise.all([
    getDashboardStats(),
    getSalesChartData(30),
    getPlatformChartData(),
    getRecentActivity(8),
    getSettings(),
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

  return (
    <div>
      <PageHeader title="Dashboard" description="Your business at a glance" />

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

      <StatCards stats={{ ...stats, currency }} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SalesChart data={salesData} currency={currency} />
        <PlatformChart data={platformData} currency={currency} />
      </div>

      <div className="mt-6">
        <RecentActivity entries={activity} />
      </div>
    </div>
  );
}
