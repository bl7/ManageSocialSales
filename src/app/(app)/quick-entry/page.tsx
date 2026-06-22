import { Suspense } from "react";
import { getActiveVariantsForSelect } from "@/lib/queries/products";
import { getSettings } from "@/lib/queries/dashboard";
import { getPartiesForSelect, getAllPartiesForSelect } from "@/lib/queries/parties";
import { getSalePaymentMethods } from "@/lib/queries/payment-methods";
import { getAccounts } from "@/lib/queries/accounts";
import { getExpenseCategories } from "@/lib/queries/expenses";
import { QuickEntryTabs } from "@/components/quick-entry/quick-entry-tabs";

export default async function QuickEntryPage() {
  const [variants, settings, customers, suppliers, parties, paymentMethods, accounts, categories] =
    await Promise.all([
      getActiveVariantsForSelect(),
      getSettings(),
      getPartiesForSelect("customer"),
      getPartiesForSelect("supplier"),
      getAllPartiesForSelect(),
      getSalePaymentMethods(),
      getAccounts(),
      getExpenseCategories(),
    ]);

  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
      <QuickEntryTabs
        variants={variants}
        customers={customers}
        paymentMethods={paymentMethods}
        suppliers={suppliers}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        categories={categories}
        parties={parties}
        currency={settings?.currency ?? "Rs."}
      />
    </Suspense>
  );
}
