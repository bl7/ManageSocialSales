import { query } from "@/lib/db";
import { T } from "@/lib/tables";
import type { LedgerEntry } from "@/types";

export interface LedgerFilters {
  productId?: string;
  size?: string;
  color?: string;
  movementType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getLedgerEntries(filters: LedgerFilters = {}, limit = 200) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.productId) {
    conditions.push(`p.id = $${idx}`);
    params.push(filters.productId);
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
  if (filters.movementType) {
    conditions.push(`il.movement_type = $${idx}`);
    params.push(filters.movementType);
    idx++;
  }
  if (filters.dateFrom) {
    conditions.push(`il.created_at >= $${idx}::date`);
    params.push(filters.dateFrom);
    idx++;
  }
  if (filters.dateTo) {
    conditions.push(`il.created_at < ($${idx}::date + interval '1 day')`);
    params.push(filters.dateTo);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(limit);

  return query<LedgerEntry>(`
    SELECT
      il.*,
      p.name AS product_name,
      pv.size,
      pv.color
    FROM ${T.inventoryLedger} il
    JOIN ${T.productVariants} pv ON pv.id = il.variant_id
    JOIN ${T.products} p ON p.id = pv.product_id
    ${where}
    ORDER BY il.created_at DESC
    LIMIT $${idx}
  `, params);
}

export async function getProductLedger(productId: string, limit = 50) {
  return getLedgerEntries({ productId }, limit);
}
