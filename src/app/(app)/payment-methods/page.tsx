import { redirect } from "next/navigation";

export default function PaymentMethodsRedirect() {
  redirect("/settings?tab=payment-methods");
}
