"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PeriodFilters } from "@/components/ui/period-filters";
import { Select } from "@/components/ui/select";

interface Props {
  dateFrom: string;
  dateTo: string;
  accountId?: string;
  direction?: string;
  accounts: { id: string; name: string }[];
}

export function TransactionFilters({ dateFrom, dateTo, accountId, direction, accounts }: Props) {
  const router = useRouter();

  function applyFilters(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    const from = data.get("dateFrom") as string;
    const to = data.get("dateTo") as string;
    const account = data.get("account_id") as string;
    const dir = data.get("direction") as string;
    if (from) params.set("dateFrom", from);
    if (to) params.set("dateTo", to);
    if (account) params.set("account_id", account);
    if (dir && dir !== "all") params.set("direction", dir);
    router.push(`/transactions?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <PeriodFilters dateFrom={dateFrom} dateTo={dateTo} basePath="/transactions" />
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters(e.currentTarget);
        }}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Account</label>
          <Select name="account_id" defaultValue={accountId ?? ""} className="min-w-[140px]">
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Direction</label>
          <Select name="direction" defaultValue={direction ?? "all"} className="min-w-[120px]">
            <option value="all">All</option>
            <option value="in">Money in</option>
            <option value="out">Money out</option>
          </Select>
        </div>
        <Button type="submit" size="sm">Apply</Button>
        <Link href="/transactions">
          <Button type="button" variant="outline" size="sm">Clear</Button>
        </Link>
      </form>
    </div>
  );
}
