import { cache } from "react";
import { getSettings } from "@/lib/queries/dashboard";
import {
  formatDate,
  formatDateTime,
  formatMonthLong,
  formatShortDate,
  parseDateCalendar,
  type DateCalendar,
} from "@/lib/date-calendar";

export const getDateCalendar = cache(async (): Promise<DateCalendar> => {
  const settings = await getSettings();
  return parseDateCalendar(settings?.date_calendar);
});

export const getDateFormatters = cache(async () => {
  const calendar = await getDateCalendar();
  return {
    calendar,
    formatDate: (date: Date | string) => formatDate(date, calendar),
    formatDateTime: (date: Date | string) => formatDateTime(date, calendar),
    formatMonthLong: (date?: Date | string) => formatMonthLong(date, calendar),
    formatShortDate: (date: Date | string) => formatShortDate(date, calendar),
  };
});
