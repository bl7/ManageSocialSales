import { queryOne } from "@/lib/db";
import { T } from "@/lib/tables";
import type { StockStatus } from "@/types";

export async function getVariantStock(variantId: string): Promise<number> {
  const row = await queryOne<{ stock: string }>(
    `SELECT COALESCE(SUM(quantity_change), 0)::int AS stock
     FROM ${T.inventoryLedger} WHERE variant_id = $1`,
    [variantId]
  );
  return Number(row?.stock ?? 0);
}

export function getStockStatus(
  stock: number,
  reorderLevel: number
): StockStatus {
  if (stock <= 0) return "out_of_stock";
  if (stock <= reorderLevel) return "low_stock";
  return "in_stock";
}

export async function getLatestUnitCost(variantId: string): Promise<number | null> {
  const row = await queryOne<{ unit_cost: string }>(
    `SELECT unit_cost FROM ${T.inventoryLedger}
     WHERE variant_id = $1 AND unit_cost IS NOT NULL AND movement_type = 'purchase'
     ORDER BY created_at DESC LIMIT 1`,
    [variantId]
  );
  return row ? Number(row.unit_cost) : null;
}
