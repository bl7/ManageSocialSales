import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardInsightAlert } from "@/lib/queries/insights";

const toneBorder = {
  amber: "border-amber-200 bg-amber-50/50",
  red: "border-red-200 bg-red-50/50",
  green: "border-emerald-200 bg-emerald-50/50",
};

export function DashboardInsightAlerts({ alerts }: { alerts: DashboardInsightAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Insights</h2>
        <Link href="/insights" className="text-sm font-medium text-primary hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {alerts.map((a) => (
          <Link
            key={a.id}
            href={a.href}
            className={cn("rounded-2xl border p-4 transition-shadow hover:shadow-sm", toneBorder[a.tone])}
          >
            <p className="text-sm font-medium leading-snug">{a.message}</p>
            <p className="mt-2 text-xs text-primary">See details →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
