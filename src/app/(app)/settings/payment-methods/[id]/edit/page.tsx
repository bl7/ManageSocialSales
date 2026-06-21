import { notFound } from "next/navigation";
import { getPaymentMethodById, getPaymentMethodSaleCount } from "@/lib/queries/payment-methods";
import { getAccounts } from "@/lib/queries/accounts";
import { PaymentMethodForm } from "@/components/forms/payment-method-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSettingsPaymentMethodPage({ params }: Props) {
  const { id } = await params;
  const [method, saleCount, accounts] = await Promise.all([
    getPaymentMethodById(id),
    getPaymentMethodSaleCount(id),
    getAccounts(),
  ]);
  if (!method || !method.is_active) notFound();
  return (
    <PaymentMethodForm
      method={{ id: method.id, name: method.name, account_id: method.account_id }}
      saleCount={saleCount}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
    />
  );
}
