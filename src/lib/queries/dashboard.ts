import { query, queryOne } from "@/lib/db";
import { getTotalReceivables, getTotalPayables } from "@/lib/queries/parties";
import { toISODate } from "@/lib/date-ranges";
import { T } from "@/lib/tables";

export async function getSettings() {
  return queryOne<{
    id: string;
    business_name: string;
    currency: string;
    low_stock_default: number;
    phone: string | null;
    address: string | null;
    business_email: string | null;
    logo_url: string | null;
    invoice_prefix: string | null;
  }>(`SELECT * FROM ${T.settings} LIMIT 1`);
}

export async function getDashboardStats() {
  const settings = await getSettings();
  const currency = settings?.currency ?? "$";

  const stats = await queryOne<{
    total_products: string;
    total_variants: string;
    total_stock_units: string;
    low_stock_items: string;
    out_of_stock_items: string;
  }>(`
    WITH stock AS (
      SELECT
        pv.id AS variant_id,
        pv.reorder_level,
        COALESCE(SUM(il.quantity_change), 0)::int AS current_stock
      FROM ${T.productVariants} pv
      LEFT JOIN ${T.inventoryLedger} il ON il.variant_id = pv.id
      WHERE pv.is_active = true
      GROUP BY pv.id, pv.reorder_level
    )
    SELECT
      (SELECT COUNT(*)::int FROM ${T.products} WHERE is_active = true) AS total_products,
      (SELECT COUNT(*)::int FROM ${T.productVariants} WHERE is_active = true) AS total_variants,
      COALESCE((SELECT SUM(current_stock) FROM stock), 0)::int AS total_stock_units,
      (SELECT COUNT(*)::int FROM stock WHERE current_stock > 0 AND current_stock <= reorder_level) AS low_stock_items,
      (SELECT COUNT(*)::int FROM stock WHERE current_stock <= 0) AS out_of_stock_items
  `);

  const inventoryValue = await queryOne<{ value: string }>(`
    WITH stock AS (
      SELECT
        pv.id AS variant_id,
        pv.default_cost_price,
        COALESCE(SUM(il.quantity_change), 0)::int AS current_stock
      FROM ${T.productVariants} pv
      LEFT JOIN ${T.inventoryLedger} il ON il.variant_id = pv.id
      WHERE pv.is_active = true
      GROUP BY pv.id, pv.default_cost_price
    ),
    costs AS (
      SELECT DISTINCT ON (variant_id)
        variant_id, unit_cost
      FROM ${T.inventoryLedger}
      WHERE movement_type = 'purchase' AND unit_cost IS NOT NULL
      ORDER BY variant_id, created_at DESC
    )
    SELECT COALESCE(SUM(
      s.current_stock * COALESCE(c.unit_cost::numeric, s.default_cost_price)
    ), 0)::numeric AS value
    FROM stock s
    LEFT JOIN costs c ON c.variant_id = s.variant_id
    WHERE s.current_stock > 0
  `);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = toISODate(monthStart);

  const salesMonth = await queryOne<{
    sales_count: string;
    units_sold: string;
    revenue: string;
  }>(`
    SELECT
      COUNT(DISTINCT s.id)::int AS sales_count,
      COALESCE(SUM(si.quantity), 0)::int AS units_sold,
      COALESCE(SUM(si.line_total), 0)::numeric AS revenue
    FROM ${T.sales} s
    JOIN ${T.saleItems} si ON si.sale_id = s.id
    WHERE s.sale_date >= $1
  `, [monthStartStr]);

  const profit = await queryOne<{ profit: string }>(`
    SELECT COALESCE(SUM(
      si.line_total - (si.quantity * pv.default_cost_price)
    ), 0)::numeric AS profit
    FROM ${T.sales} s
    JOIN ${T.saleItems} si ON si.sale_id = s.id
    JOIN ${T.productVariants} pv ON pv.id = si.variant_id
    WHERE s.sale_date >= $1
  `, [monthStartStr]);

  const [receivables, payables] = await Promise.all([
    getTotalReceivables(),
    getTotalPayables(),
  ]);

  return {
    total_products: Number(stats?.total_products ?? 0),
    total_variants: Number(stats?.total_variants ?? 0),
    total_stock_units: Number(stats?.total_stock_units ?? 0),
    inventory_value: Number(inventoryValue?.value ?? 0),
    low_stock_items: Number(stats?.low_stock_items ?? 0),
    out_of_stock_items: Number(stats?.out_of_stock_items ?? 0),
    sales_this_month: Number(salesMonth?.sales_count ?? 0),
    units_sold_this_month: Number(salesMonth?.units_sold ?? 0),
    revenue_this_month: Number(salesMonth?.revenue ?? 0),
    profit_this_month: Number(profit?.profit ?? 0),
    total_receivables: receivables,
    total_payables: payables,
    currency,
  };
}
