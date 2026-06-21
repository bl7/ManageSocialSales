import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatNepaliDate, formatNepaliDateTime } from "@/lib/nepali-date";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string,
  currency = "$",
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${currency}${num.toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  return formatNepaliDate(date);
}

export function formatDateTime(date: Date | string): string {
  return formatNepaliDateTime(date);
}
