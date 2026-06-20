export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function getDateRange(preset: string): { from: string; to: string } | null {
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
    case "month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toISODate(from), to: toISODate(today) };
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

export const REPORT_DATE_PRESETS = [
  ...SALES_DATE_PRESETS,
  { id: "30days", label: "Last 30 days" },
  { id: "90days", label: "Last 90 days" },
] as const;

export function matchesPreset(dateFrom: string | undefined, dateTo: string | undefined, preset: string): boolean {
  if (!dateFrom || !dateTo) return false;
  const range = getDateRange(preset);
  return range?.from === dateFrom && range?.to === dateTo;
}
