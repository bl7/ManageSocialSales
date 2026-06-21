import { AccountForm } from "@/components/forms/account-form";
import { getSettings } from "@/lib/queries/dashboard";

export default async function NewAccountPage() {
  const settings = await getSettings();
  return <AccountForm currency={settings?.currency ?? "Rs."} />;
}
