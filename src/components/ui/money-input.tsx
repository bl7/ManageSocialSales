"use client";

import { Input } from "@/components/ui/input";
import { isValidMoneyTyping, parseMoneyInput } from "@/lib/money-input";
import type { InputHTMLAttributes } from "react";

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "inputMode">;

interface MoneyInputProps extends BaseProps {
  value?: number | string;
  onValueChange?: (value: number) => void;
}

export function MoneyInput({ value, onValueChange, ...props }: MoneyInputProps) {
  if (onValueChange) {
    const display =
      value === "" || value === undefined || value === null
        ? ""
        : value === 0
          ? ""
          : String(value);

    return (
      <Input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(e) => {
          const next = e.target.value.trim();
          if (next === "") {
            onValueChange(0);
            return;
          }
          if (!isValidMoneyTyping(next)) return;
          const parsed = parseMoneyInput(next);
          if (parsed !== null) onValueChange(parsed);
        }}
        {...props}
      />
    );
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      pattern="^\d+(\.\d{1,2})?$"
      title="Enter a valid amount (up to 2 decimal places)"
      {...props}
    />
  );
}
