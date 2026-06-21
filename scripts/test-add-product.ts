import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../src/lib/db";
import { T } from "../src/lib/tables";

async function testAddProduct() {
  const sku = `TEST-${Date.now()}`;
  const productId = uuidv4();
  const variant1Id = uuidv4();
  const variant2Id = uuidv4();

  console.log("Testing product + variants insert...");

  await pool.query("BEGIN");
  try {
    await pool.query(
      `INSERT INTO ${T.products} (id, name, sku, category, brand, supplier, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [productId, "Test Hoodie", sku, "Hoodies", "Counter", "Test Supplier", "Automated test product"]
    );

    await pool.query(
      `INSERT INTO ${T.productVariants}
       (id, product_id, size, color, default_cost_price, default_selling_price, reorder_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7), ($8, $2, $9, $4, $10, $11, $12)`,
      [variant1Id, productId, "L", "BLACK", 820, 3400, 5, variant2Id, "M", 820, 3400, 5]
    );

    await pool.query("COMMIT");
    console.log("✓ Insert succeeded");

    const product = await pool.query(`SELECT * FROM ${T.products} WHERE id = $1`, [productId]);
    const variants = await pool.query(
      `SELECT * FROM ${T.productVariants} WHERE product_id = $1 ORDER BY size`,
      [productId]
    );

    console.log("Product:", product.rows[0]?.name, product.rows[0]?.sku);
    console.log("Variants:", variants.rows.map((v) => `${v.size}/${v.color} cost=${v.default_cost_price} price=${v.default_selling_price}`));

    // Cleanup
    await pool.query(`DELETE FROM ${T.products} WHERE id = $1`, [productId]);
    console.log("✓ Cleanup done (cascade deletes variants)");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }

  await pool.end();
}

testAddProduct().catch((err) => {
  console.error("✗ Test failed:", err.message);
  process.exit(1);
});
