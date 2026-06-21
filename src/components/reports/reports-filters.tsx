"use client";

import { Suspense } from "react";
import { ReportDatePresets } from "@/components/reports/date-presets";
import { ExportButton } from "@/components/export/export-button";
import { Button } from "@/components/ui/button";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";

interface ReportsFiltersProps {
  dateFrom?: string;
  dateTo?: string;
}

export function ReportsFilters({ dateFrom, dateTo }: ReportsFiltersProps) {
  const exportParams = new URLSearchParams();
  if (dateFrom) exportParams.set("dateFrom", dateFrom);
  if (dateTo) exportParams.set("dateTo", dateTo);
  const exportHref = `/api/export/reports${exportParams.toString() ? `?${exportParams}` : ""}`;

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-border bg-card p-4">
      <Suspense fallback={null}>
        <ReportDatePresets />
      </Suspense>
      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">From</label>
          <NepaliDateInput name="dateFrom" defaultValue={dateFrom} allowEmpty={!dateFrom} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">To</label>
          <NepaliDateInput name="dateTo" defaultValue={dateTo} allowEmpty={!dateTo} />
        </div>
        <Button type="submit">Apply</Button>
        <ExportButton href={exportHref} />
      </form>
    </div>
  );
}
