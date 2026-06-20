import "dotenv/config";
import { hashPassword, createSessionToken } from "../src/lib/auth";
import { pool } from "../src/lib/db";
import { T } from "../src/lib/tables";
import { v4 as uuidv4 } from "uuid";

/**
 * Simulates saveProductAction logic (without auth redirect).
 */
async function testSaveProductFlow() {
  const productId = uuidv4();
  const sku = `FLOW-TEST-${Date.now()}`;
  const variants = [
    { size: "L", color: "BLACK", default_cost_price: 820, default_selling_price: 3400, reorder_level: 5 },
    { size: "M", color: "BLACK", default_cost_price: 820, default_selling_price: 3400, reorder_level: 5 },
  ];

  await pool.query("BEGIN");
  try {
    await pool.query(
      `INSERT INTO ${T.products} (id, name, sku, category, brand, supplier, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [productId, "Flow Test Product", sku, "Test", "Shree", null, null]
    );
    for (const v of variants) {
      await pool.query(
        `INSERT INTO ${T.productVariants}
         (id, product_id, size, color, default_cost_price, default_selling_price, reorder_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), productId, v.size, v.color, v.default_cost_price, v.default_selling_price, v.reorder_level]
      );
    }
    await pool.query("COMMIT");
    console.log("✓ saveProductAction flow OK, product id:", productId);
    await pool.query(`DELETE FROM ${T.products} WHERE id = $1`, [productId]);
    console.log("✓ cleaned up");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }
  await pool.end();
}

testSaveProductFlow().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
