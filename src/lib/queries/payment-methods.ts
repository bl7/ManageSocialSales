import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";

export async function getSalePaymentMethods(activeOnly = true) {
  const filter = activeOnly ? "WHERE is_active = true" : "";
  return query<{ id: string; name: string }>(
    `SELECT id, name FROM ${T.salePaymentMethods} ${filter} ORDER BY name`
  );
}

export async function getPaymentMethodById(id: string) {
  return queryOne<{ id: string; name: string; is_active: boolean }>(
    `SELECT * FROM ${T.salePaymentMethods} WHERE id = $1`,
    [id]
  );
}

export async function getPaymentMethodSaleCount(methodId: string) {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM ${T.sales} WHERE payment_method_id = $1`,
    [methodId]
  );
  return Number(row?.count ?? 0);
}
