"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DatabaseUnavailableError, isDatabaseConnectionError } from "@/lib/db-errors";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const dbDown =
    error instanceof DatabaseUnavailableError || isDatabaseConnectionError(error);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8">
        <h2 className="text-xl font-semibold">
          {dbDown ? "Database unreachable" : "Something went wrong"}
        </h2>
        <p className="mt-3 text-sm text-muted">
          {dbDown
            ? "The app could not connect to PostgreSQL. If you use a remote database, check VPN, firewall, and DATABASE_URL in .env. Other pages may work once the connection is restored."
            : error.message || "An unexpected error occurred."}
        </p>
        <Button className="mt-6" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
