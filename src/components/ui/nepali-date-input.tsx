"use client";

import { useEffect, useState } from "react";
import {
  NEPALI_MONTHS,
  bsPartsToAdISO,
  getDaysInBsMonth,
  toBS,
} from "@/lib/nepali-date";
import { useDateCalendar } from "@/components/providers/date-preference-provider";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (adIso: string) => void;
  required?: boolean;
  allowEmpty?: boolean;
  className?: string;
  id?: string;
}

export function NepaliDateInput({
  name,
  defaultValue,
  value,
  onChange,
  required,
  allowEmpty,
  className,
  id,
}: Props) {
  const calendar = useDateCalendar();

  if (calendar === "AD") {
    const inputClass = cn(
      "h-11 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      className
    );
    if (value !== undefined) {
      return (
        <input
          id={id}
          name={name}
          type="date"
          required={required}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className={inputClass}
        />
      );
    }
    return (
      <input
        id={id}
        name={name}
        type="date"
        required={required}
        defaultValue={defaultValue}
        className={inputClass}
      />
    );
  }

  return (
    <BsDateInput
      name={name}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      required={required}
      allowEmpty={allowEmpty}
      className={className}
      id={id}
    />
  );
}

function BsDateInput({
  name,
  defaultValue,
  value,
  onChange,
  required,
  allowEmpty,
  className,
  id,
}: Props) {
  const hasDate = Boolean(value || defaultValue);
  const [parts, setParts] = useState(() =>
    value ? toBS(value) : defaultValue ? toBS(defaultValue) : toBS(new Date())
  );

  useEffect(() => {
    if (value) setParts(toBS(value));
  }, [value]);

  const adValue = hasDate || !allowEmpty ? bsPartsToAdISO(parts) : "";
  const maxDay = getDaysInBsMonth(parts.year, parts.month);
  const day = Math.min(parts.day, maxDay);

  function update(next: Partial<typeof parts>) {
    const merged = { ...parts, ...next };
    if (next.month !== undefined || next.year !== undefined) {
      merged.day = Math.min(merged.day, getDaysInBsMonth(merged.year, merged.month));
    }
    setParts(merged);
    onChange?.(bsPartsToAdISO(merged));
  }

  const selectClass =
    "h-11 rounded-xl border border-border bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <input type="hidden" name={name} id={id} value={adValue} required={required} readOnly />
      <select
        aria-label="BS year"
        className={cn(selectClass, "w-24")}
        value={parts.year}
        onChange={(e) => update({ year: Number(e.target.value) })}
      >
        {Array.from({ length: 122 }, (_, i) => 1978 + i).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        aria-label="BS month"
        className={cn(selectClass, "min-w-[7.5rem] flex-1")}
        value={parts.month}
        onChange={(e) => update({ month: Number(e.target.value) })}
      >
        {NEPALI_MONTHS.map((label, i) => (
          <option key={label} value={i + 1}>
            {label}
          </option>
        ))}
      </select>
      <select
        aria-label="BS day"
        className={cn(selectClass, "w-16")}
        value={day}
        onChange={(e) => update({ day: Number(e.target.value) })}
      >
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
