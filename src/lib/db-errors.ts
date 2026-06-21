export class DatabaseUnavailableError extends Error {
  constructor(message = "Cannot reach the database. Check your connection or VPN, then try again.") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

const CONNECTION_ERROR_CODES = new Set([
  "ENETUNREACH",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "57P01",
  "53300",
]);

export function isDatabaseConnectionError(error: unknown): boolean {
  if (error instanceof DatabaseUnavailableError) return true;
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code && CONNECTION_ERROR_CODES.has(e.code)) return true;
  const msg = e.message?.toLowerCase() ?? "";
  return msg.includes("connect") && (msg.includes("enotunreach") || msg.includes("econnrefused") || msg.includes("timeout"));
}

export function toDatabaseError(error: unknown): Error {
  if (isDatabaseConnectionError(error)) {
    return new DatabaseUnavailableError();
  }
  return error instanceof Error ? error : new Error("Unexpected database error");
}
