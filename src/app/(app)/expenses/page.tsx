import Link from "next/link";
import { getExpenses, getExpensesTotal, getExpenseCategories } from "@/lib/queries/expenses";
import { getSettings } from "@/lib/queries/dashboard";
import { resolveListDateRange } from "@/lib/date-ranges";
import { PageHeader, EmptyState, ListPage, ListFilterBar } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { PeriodFilters } from "@/components/ui/period-filters";
import { ExpensesSummaryCards } from "@/components/expenses/expenses-summary-cards";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseForm } from "@/components/forms/expense-form";

interface Props {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; preset?: string; new?: string }>;
}

function resolveDates(params: { dateFrom?: string; dateTo?: string; preset?: string }) {
  return resolveListDateRange(params);
}

export default async function ExpensesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { from: dateFrom, to: dateTo } = resolveDates(params);

  const [expenses, total, categories, settings] = await Promise.all([
    getExpenses(dateFrom, dateTo),
    getExpensesTotal(dateFrom, dateTo),
    getExpenseCategories(),
    getSettings(),
  ]);

  const currency = settings?.currency ?? "Rs.";

  if (params.new === "1") {
    return <ExpenseForm categories={categories} />;
  }

  return (
    <ListPage>
      <PageHeader title="Expenses" description="Business spending">
        <Link href="/expenses?new=1"><Button>Record Expense</Button></Link>
      </PageHeader>

      <ListFilterBar>
        <PeriodFilters dateFrom={dateFrom ?? ""} dateTo={dateTo ?? ""} basePath="/expenses" />
      </ListFilterBar>

      <ExpensesSummaryCards total={total} count={expenses.length} currency={currency} />

      {expenses.length === 0 ? (
        <EmptyState message="No expenses in this period." actionLabel="Record Expense" actionHref="/expenses?new=1" />
      ) : (
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {expenses.map((e: Record<string, unknown>) => (
              <tr key={e.id as string}>
                <td className="px-4 py-3">{formatDate(e.expense_date as string)}</td>
                <td className="px-4 py-3">{e.category_name as string}</td>
                <td className="px-4 py-3 font-medium">{formatCurrency(e.amount as string, currency)}</td>
                <td className="px-4 py-3 capitalize">{e.payment_method as string}</td>
                <td className="px-4 py-3 text-muted">{(e.notes as string) || "—"}</td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </ListPage>
  );
}
