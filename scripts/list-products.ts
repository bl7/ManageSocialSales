import "dotenv/config";
import { pool } from "../src/lib/db";
import { T } from "../src/lib/tables";

async function main() {
  const r = await pool.query(`
    SELECT p.name, p.sku, p.created_at::text,
      (SELECT COUNT(*)::int FROM ${T.productVariants} pv WHERE pv.product_id = p.id AND pv.is_active) AS variants
    FROM ${T.products} p
    WHERE p.is_active = true
    ORDER BY p.created_at DESC
    LIMIT 10
  `);
  console.log("Recent products:");
  console.table(r.rows);
  await pool.end();
}

main();
