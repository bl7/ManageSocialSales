import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";

export interface InvestorRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export async function getInvestors(activeOnly = true) {
  const filter = activeOnly ? "WHERE is_active = true" : "";
  return query<InvestorRow>(
    `SELECT * FROM ${T.investors} ${filter} ORDER BY name ASC`
  );
}

export async function getInvestorById(id: string) {
  return queryOne<InvestorRow>(`SELECT * FROM ${T.investors} WHERE id = $1`, [id]);
}

export async function getInvestorsWithStats(totalInvested: number) {
  const rows = await query<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    total_invested: string;
    investment_count: string;
    total_withdrawn: string;
  }>(`
    SELECT
      inv.id,
      inv.name,
      inv.phone,
      inv.email,
      COALESCE(SUM(i.amount), 0)::numeric AS total_invested,
      COUNT(i.id)::int AS investment_count,
      COALESCE((
        SELECT SUM(pw.amount) FROM ${T.profitWithdrawals} pw WHERE pw.investor_id = inv.id
      ), 0)::numeric AS total_withdrawn
    FROM ${T.investors} inv
    LEFT JOIN ${T.investments} i ON i.investor_id = inv.id
    WHERE inv.is_active = true
    GROUP BY inv.id, inv.name, inv.phone, inv.email
    ORDER BY total_invested DESC, inv.name ASC
  `);

  return rows.map((r) => {
    const invested = Number(r.total_invested);
    const withdrawn = Number(r.total_withdrawn);
    const ownershipPct = totalInvested > 0 ? (invested / totalInvested) * 100 : 0;
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      total_invested: invested,
      investment_count: Number(r.investment_count),
      total_withdrawn: withdrawn,
      ownership_pct: ownershipPct,
    };
  });
}
