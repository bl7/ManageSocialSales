import { redirect } from "next/navigation";

export default function AdjustmentsRedirect() {
  redirect("/stock-corrections/new");
}
