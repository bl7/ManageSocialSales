import {
  formatNepaliDate,
  formatNepaliDateTime,
  formatNepaliMonthLong,
  formatNepaliShortDate,
  parseDateInput,
} from "@/lib/nepali-date";

export type DateCalendar = "AD" | "BS";

export function parseDateCalendar(value: string | null | undefined): DateCalendar {
  return value === "AD" ? "AD" : "BS";
}

export function formatDate(date: Date | string, calendar: DateCalendar): string {
  if (calendar === "AD") {
    const d = parseDateInput(date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return formatNepaliDate(date);
}

export function formatDateTime(date: Date | string, calendar: DateCalendar): string {
  if (calendar === "AD") {
    const d = parseDateInput(date);
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return formatNepaliDateTime(date);
}

export function formatMonthLong(date: Date | string = new Date(), calendar: DateCalendar): string {
  if (calendar === "AD") {
    return parseDateInput(date).toLocaleDateString("en-US", { month: "long" });
  }
  return formatNepaliMonthLong(date);
}

export function formatShortDate(date: Date | string, calendar: DateCalendar): string {
  if (calendar === "AD") {
    const d = parseDateInput(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
  return formatNepaliShortDate(date);
}
