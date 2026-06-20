"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "All Parties" },
  { id: "to-collect", label: "To Collect" },
  { id: "to-pay", label: "To Pay" },
] as const;

export function PartiesTabs({ active }: { active: string }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.id === "all" ? "/parties" : `/parties?tab=${tab.id}`}
          className={cn(
            "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active === tab.id ? "bg-primary text-primary-foreground" : "text-muted hover:bg-slate-50"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export function usePartiesTab(): string {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  if (tab === "to-collect" || tab === "to-pay") return tab;
  return "all";
}
