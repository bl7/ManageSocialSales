import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InsightCardData } from "@/lib/queries/insights";

const toneStyles = {
  green: "border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white",
  amber: "border-amber-200 bg-gradient-to-br from-amber-50/80 to-white",
  red: "border-red-200 bg-gradient-to-br from-red-50/80 to-white",
  gray: "border-border bg-card",
};

export function InsightCard({ card }: { card: InsightCardData }) {
  return (
    <div className={cn("rounded-2xl border p-5", toneStyles[card.tone])}>
      <p className="text-sm font-semibold leading-snug">{card.headline}</p>
      <p className="mt-2 text-2xl font-bold">{card.metric}</p>
      <p className="mt-2 text-sm text-muted">{card.explanation}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-primary">{card.action}</p>
        <Link href={card.href}>
          <Button variant="outline" size="sm">View</Button>
        </Link>
      </div>
    </div>
  );
}
