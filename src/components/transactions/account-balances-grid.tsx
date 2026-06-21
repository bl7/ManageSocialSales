import Link from "next/link";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Landmark, Wallet } from "lucide-react";
import type { AccountType } from "@/lib/queries/accounts";

const TYPE_LABELS: Record<AccountType, string> = {
  cash: "Cash",
  bank: "Bank",
  digital: "Digital",
};

interface Account {
  id: string;
  name: string;
  account_type: AccountType;
  current_balance?: number;
}

export function AccountBalancesGrid({
  accounts,
  currency,
  activeAccountId,
}: {
  accounts: Account[];
  currency: string;
  activeAccountId?: string;
}) {
  const total = accounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase text-muted">Account Balances</h2>
        <Link href="/settings?tab=accounts" className="text-xs text-primary hover:underline">
          Manage accounts
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {accounts.map((a) => {
          const active = activeAccountId === a.id;
          return (
            <Link key={a.id} href={`/transactions?account_id=${a.id}`}>
              <Card
                className={`h-full transition-all hover:border-primary/30 hover:shadow-sm ${
                  active ? "border-primary/40 bg-teal-50/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{a.name}</CardTitle>
                    <p className="mt-0.5 text-xs capitalize text-muted">
                      {TYPE_LABELS[a.account_type]}
                    </p>
                  </div>
                  <Wallet className="h-4 w-4 shrink-0 text-primary/60" />
                </div>
                <CardValue className="mt-2 text-lg">
                  {formatCurrency(a.current_balance ?? 0, currency)}
                </CardValue>
              </Card>
            </Link>
          );
        })}
        <Card className="border-primary/30 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-start justify-between gap-2">
            <CardTitle>Total</CardTitle>
            <Landmark className="h-4 w-4 shrink-0 text-primary/70" />
          </div>
          <CardValue className="mt-2 text-lg text-primary">
            {formatCurrency(total, currency)}
          </CardValue>
          <p className="mt-1 text-xs text-muted">All accounts</p>
        </Card>
      </div>
    </section>
  );
}
