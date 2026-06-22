"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDateCalendar } from "@/components/providers/date-preference-provider";
import { getDateRange, REPORT_DATE_PRESETS, matchesPreset } from "@/lib/date-ranges";

export function ReportDatePresets() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calendar = useDateCalendar();
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  function apply(preset: string) {
    const range = getDateRange(preset, calendar);
    const params = new URLSearchParams(searchParams.toString());
    if (range) {
      params.set("dateFrom", range.from);
      params.set("dateTo", range.to);
    } else {
      params.delete("dateFrom");
      params.delete("dateTo");
    }
    params.delete("preset");
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REPORT_DATE_PRESETS.map((p) => (
        <Button
          key={p.id}
          type="button"
          variant={dateFrom && dateTo && matchesPreset(dateFrom, dateTo, p.id, calendar) ? "default" : "outline"}
          size="sm"
          onClick={() => apply(p.id)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
