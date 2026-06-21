import { getSettings, getDashboardStats } from "@/lib/queries/dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { DEFAULT_BUSINESS_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [settings, stats] = await Promise.all([getSettings(), getDashboardStats()]);
  const businessName = settings?.business_name ?? DEFAULT_BUSINESS_NAME;

  return (
    <AppShell
      businessName={businessName}
      logoUrl={settings?.logo_url}
      monthRevenue={stats.revenue_this_month}
      currency={stats.currency}
    >
      {children}
    </AppShell>
  );
}
