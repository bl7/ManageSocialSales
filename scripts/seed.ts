import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../src/lib/db";
import { T } from "../src/lib/tables";
import { hashPassword } from "../src/lib/auth";
import {
  recordPurchase,
  recordSale,
  recordAdjustment,
} from "../src/lib/queries/inventory";

async function seed() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before running seed."
    );
    process.exit(1);
  }

  console.log("Seeding database...");

  const existingUser = await pool.query(
    `SELECT id FROM ${T.appUser} WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (existingUser.rows.length === 0) {
    const passwordHash = await hashPassword(password);
    await pool.query(
      `INSERT INTO ${T.appUser} (id, email, password_hash) VALUES ($1, $2, $3)`,
      [uuidv4(), email.toLowerCase(), passwordHash]
    );
    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists, skipping.");
  }

  const existingSettings = await pool.query(`SELECT id FROM ${T.settings} LIMIT 1`);
  if (existingSettings.rows.length === 0) {
    await pool.query(
      `INSERT INTO ${T.settings} (id, business_name, currency, low_stock_default) VALUES ($1, $2, $3, $4)`,
      [uuidv4(), "COUNTER", "Rs.", 5]
    );
    console.log("Default settings created.");
  }

  const existingProducts = await pool.query(`SELECT id FROM ${T.products} LIMIT 1`);
  if (existingProducts.rows.length > 0) {
    console.log("Sample data already exists, skipping products.");
    await pool.end();
    return;
  }

  const product1Id = uuidv4();
  const product2Id = uuidv4();
  const variant1Id = uuidv4();
  const variant2Id = uuidv4();
  const variant3Id = uuidv4();
  const variant4Id = uuidv4();

  await pool.query(
    `INSERT INTO ${T.products} (id, name, sku, category, brand, supplier, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7), ($8, $9, $10, $11, $12, $13, $14)`,
    [
      product1Id, "Classic Cotton Tee", "TEE-001", "T-Shirts", "Counter", "Nepal Textiles",
      "Soft cotton everyday t-shirt",
      product2Id, "High-Waist Jeans", "JNS-001", "Jeans", "Counter", "Denim Co",
      "Comfortable high-waist jeans",
    ]
  );

  await pool.query(
    `INSERT INTO ${T.productVariants}
     (id, product_id, size, color, default_cost_price, default_selling_price, reorder_level)
     VALUES
     ($1, $2, 'M', 'White', 8.00, 18.00, 5),
     ($3, $2, 'L', 'Black', 8.00, 18.00, 5),
     ($4, $5, '28', 'Blue', 15.00, 35.00, 3),
     ($6, $5, '30', 'Blue', 15.00, 35.00, 3)`,
    [variant1Id, product1Id, variant2Id, variant3Id, product2Id, variant4Id]
  );

  console.log("Sample products created.");

  await recordPurchase("2025-01-15", "Initial stock order", [
    { variant_id: variant1Id, quantity: 20, unit_cost: 8 },
    { variant_id: variant2Id, quantity: 15, unit_cost: 8 },
  ]);

  await recordPurchase("2025-01-20", "Jeans restock", [
    { variant_id: variant3Id, quantity: 10, unit_cost: 15 },
    { variant_id: variant4Id, quantity: 12, unit_cost: 15 },
  ]);

  console.log("Sample purchases recorded.");

  await recordSale("2025-02-01", "Instagram", "Customer order #101", [
    { variant_id: variant1Id, quantity: 2, unit_sale_price: 18 },
    { variant_id: variant3Id, quantity: 1, unit_sale_price: 35 },
  ]);

  await recordSale("2025-02-05", "WhatsApp", "Repeat customer", [
    { variant_id: variant2Id, quantity: 1, unit_sale_price: 16 },
  ]);

  console.log("Sample sales recorded.");

  await recordAdjustment("2025-02-10", variant1Id, -1, "Damaged", "Water stain on one unit");

  console.log("Sample adjustment recorded.");
  console.log("Seed completed successfully.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
