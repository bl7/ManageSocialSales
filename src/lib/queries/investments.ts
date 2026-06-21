import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";
import { getExpensesTotal } from "@/lib/queries/expenses";

export interface InvestmentAllocation {
  id: string;
  account_id: string;
  account_name: string;
  amount: number;
}

export async function getInvestments() {
  return query<{
    id: string;
    investor_id: string | null;
    investor_name: string;
    investment_date: string;
    amount: string;
    notes: string | null;
    created_at: string;
    allocation_summary: string | null;
  }>(`
    SELECT i.*,
      COALESCE(inv.name, i.investor_name) AS investor_name,
      (
        SELECT string_agg(a.name || ': ' || ia.amount::text, ', ' ORDER BY a.name)
        FROM ${T.investmentAllocations} ia
        JOIN ${T.accounts} a ON a.id = ia.account_id
        WHERE ia.investment_id = i.id
      ) AS allocation_summary
    FROM ${T.investments} i
    LEFT JOIN ${T.investors} inv ON inv.id = i.investor_id
    ORDER BY i.investment_date DESC, i.created_at DESC
  `);
}

export async function getInvestmentById(id: string) {
  const investment = await queryOne<{
    id: string;
    investor_id: string | null;
    investor_name: string;
    investment_date: string;
    amount: string;
    notes: string | null;
  }>(`
    SELECT i.*, COALESCE(inv.name, i.investor_name) AS investor_name
    FROM ${T.investments} i
    LEFT JOIN ${T.investors} inv ON inv.id = i.investor_id
    WHERE i.id = $1
  `, [id]);
  if (!investment) return null;

  const allocations = await query<{
    id: string;
    account_id: string;
    account_name: string;
    amount: string;
  }>(`
    SELECT ia.id, ia.account_id, a.name AS account_name, ia.amount
    FROM ${T.investmentAllocations} ia
    JOIN ${T.accounts} a ON a.id = ia.account_id
    WHERE ia.investment_id = $1
    ORDER BY a.name
  `, [id]);

  return {
    ...investment,
    amount: Number(investment.amount),
    allocations: allocations.map((a) => ({
      id: a.id,
      account_id: a.account_id,
      account_name: a.account_name,
      amount: Number(a.amount),
    })),
  };
}

export async function getTotalInvested(): Promise<number> {
  const row = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM ${T.investments}`
  );
  return Number(row?.total ?? 0);
}

export async function getTotalProfitWithdrawn(): Promise<number> {
  const row = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM ${T.profitWithdrawals}`
  );
  return Number(row?.total ?? 0);
}

export async function getBusinessEarnings() {
  const [sales, expenses] = await Promise.all([
    queryOne<{ revenue: string; gross_profit: string }>(`
      SELECT
        COALESCE(SUM(si.line_total), 0)::numeric AS revenue,
        COALESCE(SUM(si.line_total - si.quantity * pv.default_cost_price), 0)::numeric AS gross_profit
      FROM ${T.saleItems} si
      JOIN ${T.sales} s ON s.id = si.sale_id
      JOIN ${T.productVariants} pv ON pv.id = si.variant_id
      WHERE COALESCE(s.status, 'active') = 'active'
    `),
    getExpensesTotal(),
  ]);

  const revenue = Number(sales?.revenue ?? 0);
  const grossProfit = Number(sales?.gross_profit ?? 0);
  const netProfit = grossProfit - expenses;

  return { revenue, grossProfit, expenses, netProfit };
}

export async function getInvestmentSummary() {
  const [totalInvested, totalWithdrawn, earnings, investments] = await Promise.all([
    getTotalInvested(),
    getTotalProfitWithdrawn(),
    getBusinessEarnings(),
    getInvestments(),
  ]);

  const { getInvestorsWithStats } = await import("@/lib/queries/investors");
  const byInvestor = await getInvestorsWithStats(totalInvested);
  const roi = totalInvested > 0 ? (earnings.netProfit / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalWithdrawn,
    ...earnings,
    roi,
    byInvestor,
    investments,
  };
}
