"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function getDateRange(preset: string): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  to.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);

  switch (preset) {
    case "week":
      from.setDate(from.getDate() - 7);
      break;
    case "month":
      from.setDate(1);
      break;
    case "30days":
      from.setDate(from.getDate() - 30);
      break;
    case "90days":
      from.setDate(from.getDate() - 90);
      break;
    default:
      return { from: "", to: "" };
  }

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

const PRESETS = [
  { id: "week", label: "Last 7 days" },
  { id: "month", label: "This month" },
  { id: "30days", label: "Last 30 days" },
  { id: "90days", label: "Last 90 days" },
];

export function ReportDatePresets() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(preset: string) {
    const { from, to } = getDateRange(preset);
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set("dateFrom", from);
    else params.delete("dateFrom");
    if (to) params.set("dateTo", to);
    else params.delete("dateTo");
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => (
        <Button key={p.id} type="button" variant="outline" size="sm" onClick={() => apply(p.id)}>
          {p.label}
        </Button>
      ))}
    </div>
  );
}
