import "dotenv/config";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { pool } from "../src/lib/db";

async function migrate() {
  const dir = join(__dirname, "../migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log("Running migrations...");
  for (const file of files) {
    console.log(`  → ${file}`);
    const sql = readFileSync(join(dir, file), "utf-8");
    await pool.query(sql);
  }
  console.log("Migrations completed successfully.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
