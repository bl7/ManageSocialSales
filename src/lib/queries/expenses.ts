import { query } from "@/lib/db";
import { T } from "@/lib/tables";

export async function getExpenseCategories() {
  return query<{ id: string; name: string }>(
    `SELECT id, name FROM ${T.expenseCategories} WHERE is_active = true ORDER BY name`
  );
}

export async function getExpenses(dateFrom?: string, dateTo?: string) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (dateFrom) { conditions.push(`e.expense_date >= $${idx}`); params.push(dateFrom); idx++; }
  if (dateTo) { conditions.push(`e.expense_date <= $${idx}`); params.push(dateTo); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return query(`
    SELECT e.*, c.name AS category_name, p.name AS party_name
    FROM ${T.expenses} e
    JOIN ${T.expenseCategories} c ON c.id = e.category_id
    LEFT JOIN ${T.parties} p ON p.id = e.party_id
    ${where}
    ORDER BY e.expense_date DESC, e.created_at DESC
  `, params);
}

export async function getExpensesTotal(dateFrom?: string, dateTo?: string) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (dateFrom) { conditions.push(`expense_date >= $${idx}`); params.push(dateFrom); idx++; }
  if (dateTo) { conditions.push(`expense_date <= $${idx}`); params.push(dateTo); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM ${T.expenses} ${where}`,
    params
  );
  return Number(rows[0]?.total ?? 0);
}
