import { query } from "@/lib/db";
import { T } from "@/lib/tables";

export async function getBestSellingProducts(dateFrom?: string, dateTo?: string) {
  const conditions: string[] = [];
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

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return query(`
    SELECT
      p.name AS product_name,
      pv.size,
      pv.color,
      SUM(si.quantity)::int AS total_sold,
      SUM(si.line_total)::numeric AS total_revenue
    FROM ${T.saleItems} si
    JOIN ${T.sales} s ON s.id = si.sale_id
    JOIN ${T.productVariants} pv ON pv.id = si.variant_id
    JOIN ${T.products} p ON p.id = pv.product_id
    ${where}
    GROUP BY p.name, pv.size, pv.color, pv.id
    ORDER BY total_sold DESC
    LIMIT 20
  `, params);
}

export async function getSlowMovingProducts() {
  return query(`
    WITH sold AS (
      SELECT variant_id, COALESCE(SUM(quantity), 0)::int AS total_sold
      FROM ${T.saleItems} GROUP BY variant_id
    ),
    stock AS (
      SELECT variant_id, COALESCE(SUM(quantity_change), 0)::int AS current_stock
      FROM ${T.inventoryLedger} GROUP BY variant_id
    )
    SELECT
      p.name AS product_name,
      pv.size,
      pv.color,
      COALESCE(s.total_sold, 0) AS total_sold,
      COALESCE(st.current_stock, 0) AS current_stock
    FROM ${T.productVariants} pv
    JOIN ${T.products} p ON p.id = pv.product_id
    LEFT JOIN sold s ON s.variant_id = pv.id
    LEFT JOIN stock st ON st.variant_id = pv.id
    WHERE pv.is_active = true AND p.is_active = true
    ORDER BY total_sold ASC, current_stock DESC
    LIMIT 20
  `);
}

export async function getLowStockReport() {
  return query(`
    WITH stock AS (
      SELECT variant_id, COALESCE(SUM(quantity_change), 0)::int AS current_stock
      FROM ${T.inventoryLedger} GROUP BY variant_id
    )
    SELECT p.name AS product_name, pv.size, pv.color,
      pv.reorder_level, COALESCE(s.current_stock, 0) AS current_stock
    FROM ${T.productVariants} pv
    JOIN ${T.products} p ON p.id = pv.product_id
    LEFT JOIN stock s ON s.variant_id = pv.id
    WHERE pv.is_active = true
      AND COALESCE(s.current_stock, 0) > 0
      AND COALESCE(s.current_stock, 0) <= pv.reorder_level
    ORDER BY current_stock ASC
  `);
}

export async function getOutOfStockReport() {
  return query(`
    WITH stock AS (
      SELECT variant_id, COALESCE(SUM(quantity_change), 0)::int AS current_stock
      FROM ${T.inventoryLedger} GROUP BY variant_id
    )
    SELECT p.name AS product_name, pv.size, pv.color,
      COALESCE(s.current_stock, 0) AS current_stock
    FROM ${T.productVariants} pv
    JOIN ${T.products} p ON p.id = pv.product_id
    LEFT JOIN stock s ON s.variant_id = pv.id
    WHERE pv.is_active = true AND COALESCE(s.current_stock, 0) <= 0
    ORDER BY p.name
  `);
}

export async function getInventoryValuation() {
  return query(`
    WITH stock AS (
      SELECT variant_id, COALESCE(SUM(quantity_change), 0)::int AS current_stock
      FROM ${T.inventoryLedger} GROUP BY variant_id
    ),
    costs AS (
      SELECT DISTINCT ON (variant_id) variant_id, unit_cost
      FROM ${T.inventoryLedger}
      WHERE movement_type = 'purchase' AND unit_cost IS NOT NULL
      ORDER BY variant_id, created_at DESC
    )
    SELECT
      p.name AS product_name,
      pv.size,
      pv.color,
      COALESCE(s.current_stock, 0) AS current_stock,
      COALESCE(c.unit_cost::numeric, pv.default_cost_price) AS unit_cost,
      COALESCE(s.current_stock, 0) * COALESCE(c.unit_cost::numeric, pv.default_cost_price) AS total_value
    FROM ${T.productVariants} pv
    JOIN ${T.products} p ON p.id = pv.product_id
    LEFT JOIN stock s ON s.variant_id = pv.id
    LEFT JOIN costs c ON c.variant_id = pv.id
    WHERE pv.is_active = true AND COALESCE(s.current_stock, 0) > 0
    ORDER BY total_value DESC
  `);
}

export async function getRevenueReport(dateFrom?: string, dateTo?: string) {
  const conditions: string[] = [];
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

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const summary = await query(`
    SELECT
      s.sale_date,
      s.platform,
      COUNT(DISTINCT s.id)::int AS sale_count,
      SUM(si.quantity)::int AS units_sold,
      SUM(si.line_total)::numeric AS revenue
    FROM ${T.sales} s
    JOIN ${T.saleItems} si ON si.sale_id = s.id
    ${where}
    GROUP BY s.sale_date, s.platform
    ORDER BY s.sale_date DESC
  `, params);

  const total = await query(`
    SELECT
      COALESCE(SUM(si.line_total), 0)::numeric AS total_revenue,
      COALESCE(SUM(si.quantity), 0)::int AS total_units
    FROM ${T.sales} s
    JOIN ${T.saleItems} si ON si.sale_id = s.id
    ${where}
  `, params);

  return { rows: summary, total: total[0] };
}

export async function getProfitReport(dateFrom?: string, dateTo?: string) {
  const conditions: string[] = [];
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

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return query(`
    SELECT
      s.sale_date,
      p.name AS product_name,
      pv.size,
      pv.color,
      si.quantity,
      si.unit_sale_price,
      si.line_total AS revenue,
      si.quantity * pv.default_cost_price AS estimated_cost,
      si.line_total - (si.quantity * pv.default_cost_price) AS estimated_profit
    FROM ${T.sales} s
    JOIN ${T.saleItems} si ON si.sale_id = s.id
    JOIN ${T.productVariants} pv ON pv.id = si.variant_id
    JOIN ${T.products} p ON p.id = pv.product_id
    ${where}
    ORDER BY s.sale_date DESC
  `, params);
}
