import { redirect } from "next/navigation";

export default function CreditRedirect() {
  redirect("/parties?tab=to-collect");
}
