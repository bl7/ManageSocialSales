import { getActiveVariantsForSelect } from "@/lib/queries/products";
import { AdjustmentForm } from "@/components/forms/adjustment-form";

export default async function NewAdjustmentPage() {
  const variants = await getActiveVariantsForSelect();
  return <AdjustmentForm variants={variants} />;
}
