import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";
import { ACTIVE_PURCHASE } from "@/lib/query-filters";

export async function getLastPurchaseSupplier(): Promise<string | null> {
  const row = await queryOne<{ supplier: string }>(
    `SELECT supplier FROM ${T.purchases}
     WHERE supplier IS NOT NULL AND TRIM(supplier) != ''
     ORDER BY created_at DESC LIMIT 1`
  );
  return row?.supplier ?? null;
}

export async function getSupplierSuggestions(): Promise<string[]> {
  const fromPurchases = await query<{ supplier: string }>(
    `SELECT DISTINCT supplier FROM ${T.purchases}
     WHERE supplier IS NOT NULL AND TRIM(supplier) != ''`
  );
  const fromProducts = await query<{ supplier: string }>(
    `SELECT DISTINCT supplier FROM ${T.products}
     WHERE supplier IS NOT NULL AND TRIM(supplier) != ''`
  );
  const set = new Set<string>();
  for (const r of [...fromPurchases, ...fromProducts]) {
    if (r.supplier.trim()) set.add(r.supplier.trim());
  }
  return Array.from(set).sort();
}

function buildDateFilter(dateFrom?: string, dateTo?: string, activeOnly = true) {
  const conditions: string[] = activeOnly ? [ACTIVE_PURCHASE] : [];
  const params: unknown[] = [];
  let idx = 1;
  if (dateFrom) { conditions.push(`p.purchase_date >= $${idx}`); params.push(dateFrom); idx++; }
  if (dateTo) { conditions.push(`p.purchase_date <= $${idx}`); params.push(dateTo); idx++; }
  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params };
}

export async function getPurchasesSummary(dateFrom?: string, dateTo?: string) {
  const { where, params } = buildDateFilter(dateFrom, dateTo);
  const row = await queryOne<{ purchase_count: string; units: string; total: string; credit_due: string }>(`
    SELECT
      COUNT(DISTINCT p.id)::int AS purchase_count,
      COALESCE(SUM(pi.quantity), 0)::int AS units,
      COALESCE(SUM(p.total_amount), 0)::numeric AS total,
      COALESCE(SUM(p.total_amount - p.amount_paid), 0)::numeric AS credit_due
    FROM ${T.purchases} p
    JOIN ${T.purchaseItems} pi ON pi.purchase_id = p.id
    ${where}
  `, params);
  return {
    purchase_count: Number(row?.purchase_count ?? 0),
    units: Number(row?.units ?? 0),
    total: Number(row?.total ?? 0),
    credit_due: Number(row?.credit_due ?? 0),
  };
}

export async function getPurchasesList(dateFrom?: string, dateTo?: string) {
  const { where, params } = buildDateFilter(dateFrom, dateTo, false);
  return query(`
    SELECT p.*, pt.name AS party_name,
      COUNT(pi.id)::int AS item_count,
      SUM(pi.quantity)::int AS units
    FROM ${T.purchases} p
    JOIN ${T.purchaseItems} pi ON pi.purchase_id = p.id
    LEFT JOIN ${T.parties} pt ON pt.id = p.party_id
    ${where}
    GROUP BY p.id, pt.name
    ORDER BY p.purchase_date DESC, p.created_at DESC
  `, params);
}

export async function getPurchaseById(id: string) {
  return queryOne(`SELECT p.*, pt.name AS party_name FROM ${T.purchases} p
    LEFT JOIN ${T.parties} pt ON pt.id = p.party_id WHERE p.id = $1`, [id]);
}

export async function getPurchaseItems(purchaseId: string) {
  return query(`
    SELECT pi.*, p.name AS product_name, pv.size, pv.color
    FROM ${T.purchaseItems} pi
    JOIN ${T.productVariants} pv ON pv.id = pi.variant_id
    JOIN ${T.products} p ON p.id = pv.product_id
    WHERE pi.purchase_id = $1
    ORDER BY p.name
  `, [purchaseId]);
}
