import { getActiveVariantsForSelect } from "@/lib/queries/products";
import { getSettings } from "@/lib/queries/dashboard";
import { getPartiesForSelect } from "@/lib/queries/parties";
import { getAccounts } from "@/lib/queries/accounts";
import { PurchaseForm } from "@/components/forms/purchase-form";

export default async function NewPurchasePage() {
  const [variants, settings, suppliers, accounts] = await Promise.all([
    getActiveVariantsForSelect(),
    getSettings(),
    getPartiesForSelect("supplier"),
    getAccounts(),
  ]);
  return (
    <PurchaseForm
      variants={variants}
      currency={settings?.currency ?? "Rs."}
      suppliers={suppliers}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
    />
  );
}
