import Link from "next/link";
import {
  getAccountTransactions,
  getAccountTransactionsSummary,
  getAccounts,
  getAccountEntryLabel,
  getTransactionLink,
} from "@/lib/queries/accounts";
import { getSettings } from "@/lib/queries/dashboard";
import { resolveListDateRange } from "@/lib/date-ranges";
import { PageHeader, EmptyState, ListPage, ListFilterBar } from "@/components/ui/page";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionSummaryCards } from "@/components/transactions/transaction-summary-cards";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    preset?: string;
    account_id?: string;
    direction?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { from: dateFrom, to: dateTo } = resolveListDateRange(params);

  const direction =
    params.direction === "in" || params.direction === "out" ? params.direction : undefined;

  const [transactions, summary, accounts, settings] = await Promise.all([
    getAccountTransactions({
      dateFrom,
      dateTo,
      accountId: params.account_id,
      direction,
    }),
    getAccountTransactionsSummary(dateFrom, dateTo, params.account_id),
    getAccounts(),
    getSettings(),
  ]);

  const currency = settings?.currency ?? "Rs.";

  return (
    <ListPage>
      <PageHeader
        title="Transactions"
        description="All money in and out across Cash, Bank, eSewa, and Khalti"
      />

      <ListFilterBar>
        <TransactionFilters
          dateFrom={dateFrom ?? ""}
          dateTo={dateTo ?? ""}
          accountId={params.account_id}
          direction={params.direction}
          accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        />
      </ListFilterBar>

      <TransactionSummaryCards summary={summary} currency={currency} />

      {transactions.length === 0 ? (
        <EmptyState
          message="No transactions in this period."
          actionLabel="Record a sale"
          actionHref="/sales/new"
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {transactions.map((tx) => {
              const amount = Number(tx.amount);
              const link = getTransactionLink(tx.reference_type, tx.reference_id, tx.party_id);
              return (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(tx.entry_date)}</td>
                  <td className="px-4 py-3">{getAccountEntryLabel(tx.entry_type)}</td>
                  <td className="px-4 py-3">{tx.account_name}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-medium",
                      amount > 0 ? "text-success" : "text-danger"
                    )}
                  >
                    {amount > 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(amount), currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">
                    {formatCurrency(Number(tx.balance_after), currency)}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-muted">
                    {tx.notes || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {link ? (
                      <Link href={link} className="text-sm text-primary hover:underline">
                        View
                      </Link>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </DataTableBody>
        </DataTable>
      )}
    </ListPage>
  );
}
