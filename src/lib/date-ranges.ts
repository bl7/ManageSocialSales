import { getCurrentNepaliMonthRange } from "@/lib/nepali-date";
import type { DateCalendar } from "@/lib/date-calendar";

export function getCurrentAdMonthRange(): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  return { from: toISODate(from), to: toISODate(today) };
}

export function getCurrentMonthRange(calendar: DateCalendar): { from: string; to: string } {
  return calendar === "AD" ? getCurrentAdMonthRange() : getCurrentNepaliMonthRange();
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function getDateRange(preset: string, calendar: DateCalendar = "BS"): { from: string; to: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      return { from: toISODate(today), to: toISODate(today) };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: toISODate(y), to: toISODate(y) };
    }
    case "week": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: toISODate(from), to: toISODate(today) };
    }
    case "month":
      return getCurrentMonthRange(calendar);
    case "lastmonth": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toISODate(first), to: toISODate(last) };
    }
    case "30days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: toISODate(from), to: toISODate(today) };
    }
    case "90days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 89);
      return { from: toISODate(from), to: toISODate(today) };
    }
    default:
      return null;
  }
}

export const SALES_DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "Last 7 days" },
  { id: "month", label: "This month" },
] as const;

export const INSIGHTS_DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "lastmonth", label: "Last Month" },
  { id: "90days", label: "Last 90 Days" },
] as const;

export function resolveInsightsDateRange(
  params: { dateFrom?: string; dateTo?: string; preset?: string },
  calendar: DateCalendar = "BS"
): { from: string; to: string; preset: string } {
  if (params.preset) {
    const range = getDateRange(params.preset, calendar);
    if (range) return { ...range, preset: params.preset };
  }
  if (params.dateFrom && params.dateTo) {
    return { from: params.dateFrom, to: params.dateTo, preset: "custom" };
  }
  const fallback = getDateRange("month", calendar)!;
  return { from: fallback.from, to: fallback.to, preset: "month" };
}

export const REPORT_DATE_PRESETS = [
  ...SALES_DATE_PRESETS,
  { id: "30days", label: "Last 30 days" },
  { id: "90days", label: "Last 90 days" },
] as const;

export function resolveListDateRange(
  params: { dateFrom?: string; dateTo?: string; preset?: string; range?: string },
  options?: { defaultPreset?: string; allowAll?: boolean; dateCalendar?: DateCalendar }
): { from: string | undefined; to: string | undefined } {
  const calendar = options?.dateCalendar ?? "BS";
  const defaultPreset = options?.defaultPreset ?? "month";
  if (options?.allowAll && params.range === "all") {
    return { from: undefined, to: undefined };
  }
  if (params.preset) {
    const range = getDateRange(params.preset, calendar);
    if (range) return { from: range.from, to: range.to };
  }
  if (params.dateFrom && params.dateTo) {
    return { from: params.dateFrom, to: params.dateTo };
  }
  const fallback = getDateRange(defaultPreset, calendar);
  return { from: fallback?.from, to: fallback?.to };
}

export function resolveLedgerDateRange(
  params: { dateFrom?: string; dateTo?: string; preset?: string },
  calendar: DateCalendar = "BS"
) {
  if (params.preset === "today" || (!params.dateFrom && !params.dateTo && !params.preset)) {
    const today = getDateRange("today", calendar);
    return { from: today?.from, to: today?.to };
  }
  if (params.preset) {
    const range = getDateRange(params.preset, calendar);
    if (range) return { from: range.from, to: range.to };
  }
  if (params.dateFrom || params.dateTo) {
    return { from: params.dateFrom, to: params.dateTo };
  }
  return { from: undefined, to: undefined };
}

export function matchesPreset(
  dateFrom: string | undefined,
  dateTo: string | undefined,
  preset: string,
  calendar: DateCalendar = "BS"
): boolean {
  if (!dateFrom || !dateTo) return false;
  const range = getDateRange(preset, calendar);
  return range?.from === dateFrom && range?.to === dateTo;
}
