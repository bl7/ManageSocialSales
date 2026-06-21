import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";

export async function getSalePaymentMethods(activeOnly = true) {
  const filter = activeOnly ? "WHERE pm.is_active = true" : "";
  return query<{ id: string; name: string; account_id: string | null; account_name: string | null }>(
    `SELECT pm.id, pm.name, pm.account_id, a.name AS account_name
     FROM ${T.salePaymentMethods} pm
     LEFT JOIN ${T.accounts} a ON a.id = pm.account_id
     ${filter}
     ORDER BY pm.name`
  );
}

export async function getPaymentMethodById(id: string) {
  return queryOne<{ id: string; name: string; is_active: boolean; account_id: string | null }>(
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
