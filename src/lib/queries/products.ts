import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";
import { getStockStatus } from "./stock";
import type { StockStatus, VariantWithStock } from "@/types";

export interface ProductFilters {
  search?: string;
  category?: string;
  size?: string;
  color?: string;
  stockStatus?: string;
}

export async function getProductsWithVariants(filters: ProductFilters = {}) {
  const conditions: string[] = ["p.is_active = true", "pv.is_active = true"];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.search) {
    conditions.push(`(
      p.name ILIKE $${idx} OR p.sku ILIKE $${idx} OR
      pc.name ILIKE $${idx} OR p.supplier ILIKE $${idx}
    )`);
    params.push(`%${filters.search}%`);
    idx++;
  }
  if (filters.category) {
    conditions.push(`p.category_id = $${idx}`);
    params.push(filters.category);
    idx++;
  }
  if (filters.size) {
    conditions.push(`pv.size = $${idx}`);
    params.push(filters.size);
    idx++;
  }
  if (filters.color) {
    conditions.push(`pv.color = $${idx}`);
    params.push(filters.color);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query<VariantWithStock & { latest_unit_cost: string | null }>(`
    WITH stock_data AS (
      SELECT
        variant_id,
        COALESCE(SUM(quantity_change), 0)::int AS current_stock,
        COALESCE(SUM(CASE WHEN quantity_change > 0 AND movement_type = 'purchase' THEN quantity_change ELSE 0 END), 0)::int AS purchased_qty,
        COALESCE(SUM(CASE WHEN movement_type = 'sale' THEN ABS(quantity_change) ELSE 0 END), 0)::int AS sold_qty
      FROM ${T.inventoryLedger}
      GROUP BY variant_id
    ),
    latest_costs AS (
      SELECT DISTINCT ON (variant_id) variant_id, unit_cost
      FROM ${T.inventoryLedger}
      WHERE movement_type = 'purchase' AND unit_cost IS NOT NULL
      ORDER BY variant_id, created_at DESC
    )
    SELECT
      pv.*,
      p.name AS product_name,
      p.sku,
      pc.name AS category,
      p.supplier,
      COALESCE(sd.current_stock, 0) AS current_stock,
      COALESCE(sd.purchased_qty, 0) AS purchased_qty,
      COALESCE(sd.sold_qty, 0) AS sold_qty,
      lc.unit_cost AS latest_unit_cost
    FROM ${T.productVariants} pv
    JOIN ${T.products} p ON p.id = pv.product_id
    LEFT JOIN ${T.productCategories} pc ON pc.id = p.category_id
    LEFT JOIN stock_data sd ON sd.variant_id = pv.id
    LEFT JOIN latest_costs lc ON lc.variant_id = pv.id
    ${where}
    ORDER BY p.name, pv.size, pv.color
  `, params);

  return rows
    .map((row) => ({
      ...row,
      current_stock: Number(row.current_stock),
      purchased_qty: Number(row.purchased_qty),
      sold_qty: Number(row.sold_qty),
      latest_unit_cost: row.latest_unit_cost ? Number(row.latest_unit_cost) : null,
      stock_status: getStockStatus(Number(row.current_stock), row.reorder_level),
    }))
    .filter((row) => {
      if (!filters.stockStatus) return true;
      return row.stock_status === filters.stockStatus;
    });
}

export async function getProductById(id: string) {
  return queryOne(`
    SELECT p.*, pc.name AS category_name
    FROM ${T.products} p
    LEFT JOIN ${T.productCategories} pc ON pc.id = p.category_id
    WHERE p.id = $1
  `, [id]);
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  size: string;
  color: string;
  default_cost_price: string;
  default_selling_price: string;
  reorder_level: number;
  is_active: boolean;
  current_stock: number;
  stock_status: StockStatus;
}

export async function getProductVariants(productId: string, activeOnly = true): Promise<ProductVariantRow[]> {
  const activeFilter = activeOnly ? "AND pv.is_active = true" : "";
  const rows = await query(`
    WITH stock_data AS (
      SELECT variant_id, COALESCE(SUM(quantity_change), 0)::int AS current_stock
      FROM ${T.inventoryLedger} GROUP BY variant_id
    )
    SELECT pv.*, COALESCE(sd.current_stock, 0) AS current_stock
    FROM ${T.productVariants} pv
    LEFT JOIN stock_data sd ON sd.variant_id = pv.id
    WHERE pv.product_id = $1 ${activeFilter}
    ORDER BY pv.size, pv.color
  `, [productId]);

  return rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    product_id: r.product_id as string,
    size: r.size as string,
    color: r.color as string,
    default_cost_price: r.default_cost_price as string,
    default_selling_price: r.default_selling_price as string,
    reorder_level: r.reorder_level as number,
    is_active: r.is_active as boolean,
    current_stock: Number(r.current_stock),
    stock_status: getStockStatus(Number(r.current_stock), r.reorder_level as number),
  }));
}

export async function getSizes() {
  const rows = await query<{ size: string }>(
    `SELECT DISTINCT size FROM ${T.productVariants} WHERE is_active = true ORDER BY size`
  );
  return rows.map((r) => r.size);
}

export async function getColors() {
  const rows = await query<{ color: string }>(
    `SELECT DISTINCT color FROM ${T.productVariants} WHERE is_active = true ORDER BY color`
  );
  return rows.map((r) => r.color);
}

export async function getActiveVariantsForSelect() {
  return query<{
    id: string;
    product_name: string;
    size: string;
    color: string;
    current_stock: number;
    default_selling_price: string;
  }>(`
    WITH stock_data AS (
      SELECT variant_id, COALESCE(SUM(quantity_change), 0)::int AS current_stock
      FROM ${T.inventoryLedger} GROUP BY variant_id
    )
    SELECT pv.id, p.name AS product_name, pv.size, pv.color,
      COALESCE(sd.current_stock, 0) AS current_stock,
      pv.default_selling_price
    FROM ${T.productVariants} pv
    JOIN ${T.products} p ON p.id = pv.product_id
    LEFT JOIN stock_data sd ON sd.variant_id = pv.id
    WHERE pv.is_active = true AND p.is_active = true
    ORDER BY p.name, pv.size, pv.color
  `).then((rows) =>
    rows.map((r) => ({ ...r, current_stock: Number(r.current_stock) }))
  );
}
