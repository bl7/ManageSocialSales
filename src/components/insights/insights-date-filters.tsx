"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";
import { useDateCalendar } from "@/components/providers/date-preference-provider";
import { INSIGHTS_DATE_PRESETS, matchesPreset } from "@/lib/date-ranges";

export function InsightsDateFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calendar = useDateCalendar();
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const preset = searchParams.get("preset");

  function applyPreset(presetId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", presetId);
    params.delete("dateFrom");
    params.delete("dateTo");
    router.push(`/insights?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {INSIGHTS_DATE_PRESETS.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant={
              searchParams.get("preset") === p.id ||
              (!searchParams.get("preset") && p.id === "month" && !dateFrom) ||
              (dateFrom && dateTo && matchesPreset(dateFrom, dateTo, p.id, calendar))
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => applyPreset(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <form action="/insights" method="get" className="flex flex-wrap items-end gap-3">
        {Array.from(searchParams.entries())
          .filter(([k]) => !["dateFrom", "dateTo", "preset"].includes(k))
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">From</label>
          <NepaliDateInput name="dateFrom" defaultValue={dateFrom} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">To</label>
          <NepaliDateInput name="dateTo" defaultValue={dateTo} required />
        </div>
        <Button type="submit" variant="outline" size="sm">Custom</Button>
      </form>
    </div>
  );
}
