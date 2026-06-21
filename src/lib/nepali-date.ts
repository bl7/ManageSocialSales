import { adToBs, bsToAd } from "@sbmdkl/nepali-date-converter";

export const NEPALI_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

export function parseDateInput(date: Date | string): Date {
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(date);
  }
  return date;
}

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type BSDateParts = { year: number; month: number; day: number };

export function toBS(date: Date | string): BSDateParts {
  const ad = toISODateLocal(parseDateInput(date));
  const bs = adToBs(ad);
  const [year, month, day] = bs.split("-").map(Number);
  return { year, month, day };
}

export function formatNepaliMonth(month: number): string {
  return NEPALI_MONTHS[month - 1] ?? String(month);
}

export function formatNepaliDate(date: Date | string): string {
  const { year, month, day } = toBS(date);
  return `${day} ${formatNepaliMonth(month)} ${year}`;
}

export function formatNepaliDateTime(date: Date | string): string {
  const d = parseDateInput(date);
  const { year, month, day } = toBS(d);
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${day} ${formatNepaliMonth(month)} ${year}, ${time}`;
}

export function formatNepaliMonthLong(date: Date | string = new Date()): string {
  return formatNepaliMonth(toBS(date).month);
}

export function formatNepaliShortDate(date: Date | string): string {
  const { month, day } = toBS(date);
  return `${day}/${month}`;
}

export function getCurrentNepaliMonthRange(): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { year, month } = toBS(today);
  const monthStartBs = `${year}-${String(month).padStart(2, "0")}-01`;
  return { from: bsToAd(monthStartBs), to: toISODateLocal(today) };
}

export function toBSISO(date: Date | string): string {
  const { year, month, day } = toBS(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function bsPartsToAdISO(parts: BSDateParts): string {
  const bs = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  return bsToAd(bs);
}

export function getDaysInBsMonth(year: number, month: number): number {
  for (let day = 32; day >= 28; day--) {
    try {
      bsToAd(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
      return day;
    } catch {
      continue;
    }
  }
  return 30;
}
