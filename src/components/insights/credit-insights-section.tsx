import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { CreditInsightsData } from "@/lib/queries/insights";

export function CreditInsightsSection({
  data,
  currency,
}: {
  data: CreditInsightsData;
  currency: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5">
        <p className="text-sm text-muted">Money Owed To You</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(data.owedToYou, currency)}</p>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-white p-5">
        <p className="text-sm text-muted">Money You Owe</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(data.youOwe, currency)}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted">Net Credit Position</p>
        <p className={`mt-1 text-2xl font-bold ${data.netPosition >= 0 ? "text-emerald-700" : "text-amber-700"}`}>
          {formatCurrency(data.netPosition, currency)}
        </p>
      </div>

      {data.overdueCount > 0 && (
        <div className="lg:col-span-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
          <span className="font-medium text-red-800">
            {data.overdueCount} overdue sale{data.overdueCount === 1 ? "" : "s"}
          </span>
          {" — "}
          {formatCurrency(data.overdueAmount, currency)} past due date.
          <Link href="/parties?tab=to-collect" className="ml-2 font-medium text-primary hover:underline">
            Follow up →
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
        <h4 className="mb-3 font-semibold">Top customers owing you</h4>
        {data.topReceivables.length === 0 ? (
          <p className="text-sm text-muted">No outstanding customer credit.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.topReceivables.map((p) => (
              <li key={p.id} className="flex justify-between">
                <Link href={`/parties/${p.id}`} className="font-medium text-primary hover:underline">{p.name}</Link>
                <span>{formatCurrency(p.balance, currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h4 className="mb-3 font-semibold">Top suppliers you owe</h4>
        {data.topPayables.length === 0 ? (
          <p className="text-sm text-muted">No outstanding supplier credit.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.topPayables.map((p) => (
              <li key={p.id} className="flex justify-between">
                <Link href={`/parties/${p.id}`} className="font-medium text-primary hover:underline">{p.name}</Link>
                <span>{formatCurrency(p.balance, currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
