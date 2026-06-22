import { getSettings, getDashboardStats } from "@/lib/queries/dashboard";
import { parseDateCalendar } from "@/lib/date-calendar";
import { DatePreferenceProvider } from "@/components/providers/date-preference-provider";
import { AppShell } from "@/components/layout/app-shell";
import { DEFAULT_BUSINESS_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const dateCalendar = parseDateCalendar(settings?.date_calendar);
  const [stats] = await Promise.all([getDashboardStats(dateCalendar)]);
  const businessName = settings?.business_name ?? DEFAULT_BUSINESS_NAME;

  return (
    <DatePreferenceProvider calendar={dateCalendar}>
      <AppShell
        businessName={businessName}
        logoUrl={settings?.logo_url}
        monthRevenue={stats.revenue_this_month}
        currency={stats.currency}
      >
        {children}
      </AppShell>
    </DatePreferenceProvider>
  );
}
