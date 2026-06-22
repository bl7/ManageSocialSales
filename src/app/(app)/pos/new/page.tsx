import { getActiveVariantsForSelect } from "@/lib/queries/products";
import { getSettings } from "@/lib/queries/dashboard";
import { getPartiesForSelect } from "@/lib/queries/parties";
import { getSalePaymentMethods } from "@/lib/queries/payment-methods";
import { SaleForm } from "@/components/forms/sale-form";

export default async function PosPage() {
  const [variants, settings, customers, paymentMethods] = await Promise.all([
    getActiveVariantsForSelect(),
    getSettings(),
    getPartiesForSelect("customer"),
    getSalePaymentMethods(),
  ]);
  return (
    <SaleForm
      variants={variants}
      customers={customers}
      paymentMethods={paymentMethods}
      currency={settings?.currency ?? "Rs."}
    />
  );
}
