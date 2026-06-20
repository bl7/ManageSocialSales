import { getActiveVariantsForSelect } from "@/lib/queries/products";
import { PurchaseForm } from "@/components/forms/purchase-form";

export default async function NewPurchasePage() {
  const variants = await getActiveVariantsForSelect();
  return <PurchaseForm variants={variants} />;
}
