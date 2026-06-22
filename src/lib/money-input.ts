export const MONEY_TYPING_PATTERN = /^\d*\.?\d{0,2}$/;
export const MONEY_SUBMIT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function isValidMoneyTyping(value: string): boolean {
  return MONEY_TYPING_PATTERN.test(value);
}

export function parseMoneyInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (!MONEY_SUBMIT_PATTERN.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
