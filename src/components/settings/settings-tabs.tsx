"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile", label: "Business Profile" },
  { id: "invoice", label: "Invoice Settings" },
  { id: "categories", label: "Product Categories" },
  { id: "payment-methods", label: "Payment Methods" },
  { id: "expense-categories", label: "Expense Categories" },
  { id: "preferences", label: "App Preferences" },
] as const;

export type SettingsTab = (typeof TABS)[number]["id"];

export function SettingsTabs({ active }: { active: SettingsTab }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/settings?tab=${tab.id}`}
          className={cn(
            "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active === tab.id ? "bg-primary text-primary-foreground" : "text-muted hover:bg-slate-50 hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export function useSettingsTab(defaultTab: SettingsTab = "profile"): SettingsTab {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") as SettingsTab | null;
  if (tab && TABS.some((t) => t.id === tab)) return tab;
  return defaultTab;
}

export function SettingsTabRedirect({ tab }: { tab: SettingsTab }) {
  const router = useRouter();
  if (typeof window !== "undefined") router.replace(`/settings?tab=${tab}`);
  return null;
}
