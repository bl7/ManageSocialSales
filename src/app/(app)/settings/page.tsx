import { getSettings } from "@/lib/queries/dashboard";
import { SettingsForm } from "@/components/forms/settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <SettingsForm
      settings={{
        business_name: settings?.business_name ?? "Shree Inventory",
        currency: settings?.currency ?? "$",
        low_stock_default: settings?.low_stock_default ?? 5,
      }}
    />
  );
}
