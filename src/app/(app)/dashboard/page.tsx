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
import { Plus, ShoppingCart } from "lucide-react";

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
      <PageHeader title="Dashboard" description="Your business at a glance">
        <Link href="/sales/new">
          <Button><ShoppingCart className="mr-2 h-4 w-4" />Record Sale</Button>
        </Link>
        <Link href="/products/new">
          <Button variant="outline"><Plus className="mr-2 h-4 w-4" />Add Product</Button>
        </Link>
      </PageHeader>

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
