"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", href: "/investment" },
  { id: "investors", label: "Investors", href: "/investment?tab=investors" },
] as const;

export function InvestmentTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";

  if (pathname !== "/investment") return null;

  return (
    <div className="mb-6 flex gap-2 border-b border-border">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            tab === t.id
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
