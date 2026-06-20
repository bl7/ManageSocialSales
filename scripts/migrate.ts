import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "../src/lib/db";

async function migrate() {
  const sql = readFileSync(
    join(__dirname, "../migrations/001_initial.sql"),
    "utf-8"
  );

  console.log("Running migrations...");
  await pool.query(sql);
  console.log("Migrations completed successfully.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
