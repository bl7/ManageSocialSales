"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MovementBadge } from "@/components/ui/badge";
import { useFormatDate } from "@/components/providers/date-preference-provider";
import type { LedgerEntry } from "@/types";
import { ArrowRight } from "lucide-react";

export function RecentActivity({ entries }: { entries: LedgerEntry[] }) {
  const { formatDateTime } = useFormatDate();

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
        <ul className="space-y-4">
          {entries.map((e) => (
            <li key={e.id} className="relative flex gap-3 rounded-xl border border-border/70 bg-slate-50/50 p-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{formatDateTime(e.created_at)}</p>
                <p className="mt-1 truncate text-sm font-medium">{e.product_name}</p>
                <p className="text-xs text-muted">
                  {e.size} / {e.color}
                </p>
              </div>
              <div className="ml-2 flex items-center gap-2">
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
