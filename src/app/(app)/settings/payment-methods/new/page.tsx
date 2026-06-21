import { getAccounts } from "@/lib/queries/accounts";
import { PaymentMethodForm } from "@/components/forms/payment-method-form";

export default async function NewPaymentMethodPage() {
  const accounts = await getAccounts();
  return <PaymentMethodForm accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} />;
}
