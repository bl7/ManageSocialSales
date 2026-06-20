import { redirect } from "next/navigation";

export default function PaymentMethodsNewRedirect() {
  redirect("/settings/payment-methods/new");
}
