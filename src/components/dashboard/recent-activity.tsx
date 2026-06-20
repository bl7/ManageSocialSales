import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MovementBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { LedgerEntry } from "@/types";
import { ArrowRight } from "lucide-react";

export function RecentActivity({ entries }: { entries: LedgerEntry[] }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Recent Activity</h3>
        <Link href="/ledger" className="flex items-center gap-1 text-sm text-primary hover:underline">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No stock movements yet</p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.product_name}</p>
                <p className="text-xs text-muted">
                  {e.size} / {e.color} · {formatDateTime(e.created_at)}
                </p>
              </div>
              <div className="ml-3 flex items-center gap-2">
                <MovementBadge type={e.movement_type} />
                <span className={`text-sm font-semibold ${e.quantity_change > 0 ? "text-success" : "text-danger"}`}>
                  {e.quantity_change > 0 ? "+" : ""}{e.quantity_change}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
