"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { SaleForm } from "@/components/forms/sale-form";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { ExpenseForm } from "@/components/forms/expense-form";
import { QuickPaymentForm } from "@/components/forms/quick-payment-form";

const TABS = [
  { id: "pos", label: "POS" },
  { id: "purchase", label: "Purchase" },
  { id: "payment", label: "Payment" },
  { id: "expense", label: "Expense" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  variants: Parameters<typeof SaleForm>[0]["variants"];
  customers: Parameters<typeof SaleForm>[0]["customers"];
  paymentMethods: Parameters<typeof SaleForm>[0]["paymentMethods"];
  suppliers: Parameters<typeof PurchaseForm>[0]["suppliers"];
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  parties: { id: string; name: string; phone?: string | null }[];
  currency: string;
}

export function QuickEntryTabs({
  variants,
  customers,
  paymentMethods,
  suppliers,
  accounts,
  categories,
  parties,
  currency,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab") || "pos";
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : "pos";

  function setTab(id: TabId) {
    router.replace(`/quick-entry?tab=${id}`);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quick Entry</h1>
          <p className="text-sm text-muted">Fast POS, purchase, payment, and expense entries</p>
        </div>
        <Link href="/pos/new" className="text-sm font-medium text-primary hover:underline">
          Open full POS →
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pos" && (
        <SaleForm
          compact
          variants={variants}
          customers={customers}
          paymentMethods={paymentMethods}
          currency={currency}
        />
      )}
      {tab === "purchase" && (
        <PurchaseForm
          compact
          variants={variants}
          suppliers={suppliers}
          accounts={accounts}
          currency={currency}
        />
      )}
      {tab === "payment" && (
        <QuickPaymentForm parties={parties} accounts={accounts} />
      )}
      {tab === "expense" && (
        <ExpenseForm compact redirectTo={false} categories={categories} accounts={accounts} />
      )}
    </div>
  );
}
