import { notFound } from "next/navigation";
import { getPaymentMethodById, getPaymentMethodSaleCount } from "@/lib/queries/payment-methods";
import { PaymentMethodForm } from "@/components/forms/payment-method-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSettingsPaymentMethodPage({ params }: Props) {
  const { id } = await params;
  const [method, saleCount] = await Promise.all([
    getPaymentMethodById(id),
    getPaymentMethodSaleCount(id),
  ]);
  if (!method || !method.is_active) notFound();
  return <PaymentMethodForm method={{ id: method.id, name: method.name }} saleCount={saleCount} />;
}
