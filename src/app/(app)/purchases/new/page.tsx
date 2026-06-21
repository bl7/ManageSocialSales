import { getActiveVariantsForSelect } from "@/lib/queries/products";
import { getSettings } from "@/lib/queries/dashboard";
import { getLastPurchaseSupplier, getSupplierSuggestions } from "@/lib/queries/purchases";
import { getPartiesForSelect } from "@/lib/queries/parties";
import { getAccounts } from "@/lib/queries/accounts";
import { PurchaseForm } from "@/components/forms/purchase-form";

export default async function NewPurchasePage() {
  const [variants, settings, lastSupplier, supplierSuggestions, suppliers, accounts] = await Promise.all([
    getActiveVariantsForSelect(),
    getSettings(),
    getLastPurchaseSupplier(),
    getSupplierSuggestions(),
    getPartiesForSelect("supplier"),
    getAccounts(),
  ]);
  return (
    <PurchaseForm
      variants={variants}
      currency={settings?.currency ?? "Rs."}
      lastSupplier={lastSupplier}
      supplierSuggestions={supplierSuggestions}
      suppliers={suppliers}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
    />
  );
}
