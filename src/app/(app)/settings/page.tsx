import { Suspense } from "react";
import { getSettings } from "@/lib/queries/dashboard";
import { SettingsForm } from "@/components/forms/settings-form";
import { SettingsTabs, type SettingsTab } from "@/components/settings/settings-tabs";
import { SettingsCategoriesPanel } from "@/components/settings/settings-categories-panel";
import { SettingsPaymentMethodsPanel } from "@/components/settings/settings-payment-methods-panel";
import { SettingsExpenseCategoriesPanel } from "@/components/settings/settings-expense-categories-panel";
import { PageHeader } from "@/components/ui/page";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

function tabFromParam(tab?: string): SettingsTab {
  const valid = ["profile", "invoice", "categories", "payment-methods", "expense-categories", "preferences"];
  if (tab && valid.includes(tab)) return tab as SettingsTab;
  return "profile";
}

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = tabFromParam(params.tab);
  const settings = await getSettings();

  const settingsData = {
    business_name: settings?.business_name ?? "Shree Inventory",
    currency: settings?.currency ?? "Rs.",
    low_stock_default: settings?.low_stock_default ?? 5,
    phone: settings?.phone,
    address: settings?.address,
    business_email: settings?.business_email,
    logo_url: settings?.logo_url,
    invoice_prefix: settings?.invoice_prefix,
  };

  return (
    <div>
      <PageHeader title="Settings" description="Business profile, categories, and preferences" />
      <Suspense fallback={null}>
        <SettingsTabs active={tab} />
      </Suspense>

      {tab === "profile" && <SettingsForm settings={settingsData} section="profile" />}
      {tab === "invoice" && <SettingsForm settings={settingsData} section="invoice" />}
      {tab === "preferences" && <SettingsForm settings={settingsData} section="preferences" />}
      {tab === "categories" && <SettingsCategoriesPanel />}
      {tab === "payment-methods" && <SettingsPaymentMethodsPanel />}
      {tab === "expense-categories" && <SettingsExpenseCategoriesPanel />}
    </div>
  );
}
