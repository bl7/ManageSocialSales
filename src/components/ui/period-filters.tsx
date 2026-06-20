"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SALES_DATE_PRESETS, matchesPreset } from "@/lib/date-ranges";

interface Props {
  dateFrom: string;
  dateTo: string;
  basePath?: string;
}

export function PeriodFilters({ dateFrom, dateTo, basePath = "/purchases" }: Props) {
  const router = useRouter();

  function applyPreset(preset: string) {
    router.push(`${basePath}?preset=${preset}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SALES_DATE_PRESETS.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant={matchesPreset(dateFrom, dateTo, p.id) ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset(p.id)}
          >
            {p.label}
          </Button>
        ))}
        <Link href={`${basePath}?preset=month`}>
          <Button type="button" variant="outline" size="sm">This month</Button>
        </Link>
      </div>
      <form action={basePath} method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">From</label>
          <input name="dateFrom" type="date" defaultValue={dateFrom} className="h-11 rounded-xl border border-border px-3 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">To</label>
          <input name="dateTo" type="date" defaultValue={dateTo} className="h-11 rounded-xl border border-border px-3 text-sm" />
        </div>
        <Button type="submit">Apply</Button>
      </form>
    </div>
  );
}
