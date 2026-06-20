import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";
import { ACTIVE_SALE } from "@/lib/query-filters";

function buildDateFilter(dateFrom?: string, dateTo?: string, activeOnly = true) {
  const conditions: string[] = activeOnly ? [ACTIVE_SALE] : [];
  const params: unknown[] = [];
  let idx = 1;

  if (dateFrom) {
    conditions.push(`s.sale_date >= $${idx}`);
    params.push(dateFrom);
    idx++;
  }
  if (dateTo) {
    conditions.push(`s.sale_date <= $${idx}`);
    params.push(dateTo);
    idx++;
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params };
}

export async function getSalesSummary(dateFrom?: string, dateTo?: string) {
  const { where, params } = buildDateFilter(dateFrom, dateTo);

  const row = await queryOne<{
    sale_count: string;
    units_sold: string;
    revenue: string;
    estimated_profit: string;
  }>(`
    SELECT
      COUNT(DISTINCT s.id)::int AS sale_count,
      COALESCE(SUM(si.quantity), 0)::int AS units_sold,
      COALESCE((
        SELECT SUM(total_amount) FROM ${T.sales} s2
        WHERE COALESCE(s2.status, 'active') = 'active'
        ${where ? " AND " + where.replace(/^WHERE\s+/i, "").replace(/\bs\./g, "s2.") : ""}
      ), 0)::numeric AS revenue,
      COALESCE(SUM(si.line_total - si.quantity * pv.default_cost_price), 0)::numeric AS estimated_profit
    FROM ${T.sales} s
    JOIN ${T.saleItems} si ON si.sale_id = s.id
    JOIN ${T.productVariants} pv ON pv.id = si.variant_id
    ${where}
  `, params);

  return {
    sale_count: Number(row?.sale_count ?? 0),
    units_sold: Number(row?.units_sold ?? 0),
    revenue: Number(row?.revenue ?? 0),
    estimated_profit: Number(row?.estimated_profit ?? 0),
  };
}

export interface SaleListRow {
  id: string;
  sale_date: string;
  platform: string | null;
  notes: string | null;
  total_amount: string;
  created_at: string;
  status?: string;
  item_count: number;
  units: number;
  revenue: string;
  estimated_profit: string;
}

export async function getSalesList(dateFrom?: string, dateTo?: string): Promise<SaleListRow[]> {
  const { where, params } = buildDateFilter(dateFrom, dateTo, false);

  const rows = await query<SaleListRow>(`
    SELECT
      s.id,
      s.sale_date,
      s.platform,
      s.notes,
      s.total_amount,
      s.created_at,
      s.payment_status,
      s.amount_paid,
      s.status,
      s.voided_at,
      s.void_reason,
      s.invoice_number,
      pm.name AS payment_method_name,
      pt.name AS party_name,
      COUNT(si.id)::int AS item_count,
      SUM(si.quantity)::int AS units,
      SUM(si.line_total)::numeric + COALESCE(s.delivery_charge, 0) AS revenue,
      SUM(si.line_total - si.quantity * pv.default_cost_price)::numeric AS estimated_profit
    FROM ${T.sales} s
    JOIN ${T.saleItems} si ON si.sale_id = s.id
    JOIN ${T.productVariants} pv ON pv.id = si.variant_id
    LEFT JOIN ${T.parties} pt ON pt.id = s.party_id
    LEFT JOIN ${T.salePaymentMethods} pm ON pm.id = s.payment_method_id
    ${where}
    GROUP BY s.id, pt.name, pm.name
    ORDER BY s.sale_date DESC, s.created_at DESC
  `, params);

  return rows.map((r) => ({
    ...r,
    item_count: Number(r.item_count),
    units: Number(r.units),
  }));
}

export async function getSaleById(id: string) {
  return queryOne(
    `SELECT s.*, p.name AS party_name, p.phone AS party_phone, pm.name AS payment_method_name
     FROM ${T.sales} s
     LEFT JOIN ${T.parties} p ON p.id = s.party_id
     LEFT JOIN ${T.salePaymentMethods} pm ON pm.id = s.payment_method_id
     WHERE s.id = $1`,
    [id]
  );
}

export async function getSaleItems(saleId: string) {
  return query<{
    id: string;
    quantity: number;
    unit_sale_price: string;
    line_total: string;
    product_name: string;
    size: string;
    color: string;
    default_cost_price: string;
    estimated_profit: string;
  }>(`
    SELECT
      si.id,
      si.quantity,
      si.unit_sale_price,
      si.line_total,
      p.name AS product_name,
      pv.size,
      pv.color,
      pv.default_cost_price,
      si.line_total - (si.quantity * pv.default_cost_price) AS estimated_profit
    FROM ${T.saleItems} si
    JOIN ${T.productVariants} pv ON pv.id = si.variant_id
    JOIN ${T.products} p ON p.id = pv.product_id
    WHERE si.sale_id = $1
    ORDER BY p.name, pv.size, pv.color
  `, [saleId]);
}
