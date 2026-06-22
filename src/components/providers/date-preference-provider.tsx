"use client";

import { createContext, useContext, useMemo } from "react";
import {
  formatDate,
  formatDateTime,
  formatMonthLong,
  formatShortDate,
  type DateCalendar,
} from "@/lib/date-calendar";

const DatePreferenceContext = createContext<DateCalendar>("BS");

export function DatePreferenceProvider({
  calendar,
  children,
}: {
  calendar: DateCalendar;
  children: React.ReactNode;
}) {
  return (
    <DatePreferenceContext.Provider value={calendar}>{children}</DatePreferenceContext.Provider>
  );
}

export function useDateCalendar(): DateCalendar {
  return useContext(DatePreferenceContext);
}

export function useFormatDate() {
  const calendar = useDateCalendar();
  return useMemo(
    () => ({
      calendar,
      formatDate: (date: Date | string) => formatDate(date, calendar),
      formatDateTime: (date: Date | string) => formatDateTime(date, calendar),
      formatMonthLong: (date?: Date | string) => formatMonthLong(date, calendar),
      formatShortDate: (date: Date | string) => formatShortDate(date, calendar),
    }),
    [calendar]
  );
}
