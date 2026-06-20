import { getActiveVariantsForSelect } from "@/lib/queries/products";
import { SaleForm } from "@/components/forms/sale-form";

export default async function NewSalePage() {
  const variants = await getActiveVariantsForSelect();
  return <SaleForm variants={variants} />;
}
