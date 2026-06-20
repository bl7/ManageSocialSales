import { getActiveVariantsForSelect } from "@/lib/queries/products";
import { getSettings } from "@/lib/queries/dashboard";
import { getLastPurchaseSupplier, getSupplierSuggestions } from "@/lib/queries/purchases";
import { getPartiesForSelect } from "@/lib/queries/parties";
import { PurchaseForm } from "@/components/forms/purchase-form";

export default async function NewPurchasePage() {
  const [variants, settings, lastSupplier, supplierSuggestions, suppliers] = await Promise.all([
    getActiveVariantsForSelect(),
    getSettings(),
    getLastPurchaseSupplier(),
    getSupplierSuggestions(),
    getPartiesForSelect("supplier"),
  ]);
  return (
    <PurchaseForm
      variants={variants}
      currency={settings?.currency ?? "Rs."}
      lastSupplier={lastSupplier}
      supplierSuggestions={supplierSuggestions}
      suppliers={suppliers}
    />
  );
}
