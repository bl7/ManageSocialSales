import { query } from "@/lib/db";
import { toISODate } from "@/lib/date-ranges";
import { T } from "@/lib/tables";
import { getLedgerEntries } from "./ledger";

export async function getSalesChartData(days = 30) {
  return query<{ date: string; revenue: string; units: string }>(`
    SELECT
      s.sale_date::text AS date,
      COALESCE(SUM(si.line_total), 0)::numeric AS revenue,
      COALESCE(SUM(si.quantity), 0)::int AS units
    FROM ${T.sales} s
    JOIN ${T.saleItems} si ON si.sale_id = s.id
    WHERE s.sale_date >= CURRENT_DATE - $1::int
    GROUP BY s.sale_date
    ORDER BY s.sale_date ASC
  `, [days]);
}

export async function getPlatformChartData() {
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = toISODate(monthStart);

  return query<{ platform: string; revenue: string; count: string }>(`
    SELECT
      COALESCE(s.platform, 'Other') AS platform,
      COALESCE(SUM(si.line_total), 0)::numeric AS revenue,
      COUNT(DISTINCT s.id)::int AS count
    FROM ${T.sales} s
    JOIN ${T.saleItems} si ON si.sale_id = s.id
    WHERE s.sale_date >= $1
    GROUP BY s.platform
    ORDER BY revenue DESC
  `, [monthStartStr]);
}

export async function getRecentActivity(limit = 10) {
  return getLedgerEntries({}, limit);
}
