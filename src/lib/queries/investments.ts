import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";
import { getExpensesTotal } from "@/lib/queries/expenses";

export async function getInvestments() {
  return query<{
    id: string;
    investor_name: string;
    investment_date: string;
    amount: string;
    notes: string | null;
    created_at: string;
  }>(`
    SELECT * FROM ${T.investments}
    ORDER BY investment_date DESC, created_at DESC
  `);
}

export async function getTotalInvested(): Promise<number> {
  const row = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM ${T.investments}`
  );
  return Number(row?.total ?? 0);
}

export async function getInvestmentsByInvestor() {
  const rows = await query<{ investor_name: string; total: string; count: string }>(`
    SELECT investor_name,
      SUM(amount)::numeric AS total,
      COUNT(*)::int AS count
    FROM ${T.investments}
    GROUP BY investor_name
    ORDER BY total DESC
  `);
  return rows.map((r) => ({
    investor_name: r.investor_name,
    total: Number(r.total),
    count: Number(r.count),
  }));
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
  const [totalInvested, earnings, byInvestor, investments] = await Promise.all([
    getTotalInvested(),
    getBusinessEarnings(),
    getInvestmentsByInvestor(),
    getInvestments(),
  ]);

  const roi = totalInvested > 0 ? (earnings.netProfit / totalInvested) * 100 : 0;

  return {
    totalInvested,
    ...earnings,
    roi,
    byInvestor,
    investments,
  };
}
