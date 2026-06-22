import { Suspense } from "react";
import { getSettings } from "@/lib/queries/dashboard";
import { SettingsForm } from "@/components/forms/settings-form";
import { SettingsTabs, type SettingsTab } from "@/components/settings/settings-tabs";
import { SettingsCategoriesPanel } from "@/components/settings/settings-categories-panel";
import { SettingsPaymentMethodsPanel } from "@/components/settings/settings-payment-methods-panel";
import { SettingsAccountsPanel } from "@/components/settings/settings-accounts-panel";
import { SettingsExpenseCategoriesPanel } from "@/components/settings/settings-expense-categories-panel";
import { PageHeader } from "@/components/ui/page";
import { DEFAULT_BUSINESS_NAME } from "@/lib/branding";
import { parseDateCalendar } from "@/lib/date-calendar";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

function tabFromParam(tab?: string): SettingsTab {
  const valid = ["profile", "invoice", "categories", "payment-methods", "accounts", "expense-categories", "preferences"];
  if (tab && valid.includes(tab)) return tab as SettingsTab;
  return "profile";
}

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = tabFromParam(params.tab);
  const settings = await getSettings();

  const settingsData = {
    business_name: settings?.business_name ?? DEFAULT_BUSINESS_NAME,
    currency: settings?.currency ?? "Rs.",
    low_stock_default: settings?.low_stock_default ?? 5,
    phone: settings?.phone,
    address: settings?.address,
    business_email: settings?.business_email,
    logo_url: settings?.logo_url,
    invoice_prefix: settings?.invoice_prefix,
    date_calendar: parseDateCalendar(settings?.date_calendar),
  };
  const tabDescriptions: Record<SettingsTab, string> = {
    profile: "Business identity and contact details",
    invoice: "Invoice numbering and defaults",
    categories: "Manage product category options",
    "payment-methods": "Manage sale payment methods",
    accounts: "Cash, bank, and digital wallet balances",
    "expense-categories": "Manage expense category options",
    preferences: "Currency, dates, and application defaults",
  };

  return (
    <div>
      <PageHeader title="Settings" description="Business profile, categories, and preferences" />
      <Suspense fallback={null}>
        <SettingsTabs active={tab} />
      </Suspense>
      <div className="mb-4">
        <p className="text-sm text-muted">{tabDescriptions[tab]}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        {tab === "profile" && <SettingsForm settings={settingsData} section="profile" />}
        {tab === "invoice" && <SettingsForm settings={settingsData} section="invoice" />}
        {tab === "preferences" && <SettingsForm settings={settingsData} section="preferences" />}
        {tab === "categories" && <SettingsCategoriesPanel />}
        {tab === "payment-methods" && <SettingsPaymentMethodsPanel />}
        {tab === "accounts" && <SettingsAccountsPanel />}
        {tab === "expense-categories" && <SettingsExpenseCategoriesPanel />}
      </div>
    </div>
  );
}
