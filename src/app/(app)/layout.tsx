import { getSettings } from "@/lib/queries/dashboard";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { Sidebar } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [settings, stats] = await Promise.all([getSettings(), getDashboardStats()]);
  const businessName = settings?.business_name ?? "Shree Inventory";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        businessName={businessName}
        logoUrl={settings?.logo_url}
        monthRevenue={stats.revenue_this_month}
        currency={stats.currency}
      />
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 md:px-6 md:pb-8 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
