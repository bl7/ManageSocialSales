import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";

export async function getProductCategories(activeOnly = true) {
  const filter = activeOnly ? "WHERE is_active = true" : "";
  return query<{ id: string; name: string }>(
    `SELECT id, name FROM ${T.productCategories} ${filter} ORDER BY name`
  );
}

export async function getProductCategoriesWithCounts() {
  return query<{ id: string; name: string; product_count: number }>(`
    SELECT c.id, c.name, COUNT(p.id)::int AS product_count
    FROM ${T.productCategories} c
    LEFT JOIN ${T.products} p ON p.category_id = c.id AND p.is_active = true
    WHERE c.is_active = true
    GROUP BY c.id, c.name
    ORDER BY c.name
  `);
}

export async function getCategoryById(id: string) {
  return queryOne<{ id: string; name: string; is_active: boolean }>(
    `SELECT * FROM ${T.productCategories} WHERE id = $1`,
    [id]
  );
}

export async function getCategoryProductCount(categoryId: string) {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM ${T.products} WHERE category_id = $1 AND is_active = true`,
    [categoryId]
  );
  return Number(row?.count ?? 0);
}
