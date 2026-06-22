import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../src/lib/db";
import { T } from "../src/lib/tables";
import { hashPassword } from "../src/lib/auth";

const NEW_ADMIN_EMAIL = "admin@shreeteen.com";
const NEW_ADMIN_PASSWORD = "TeenShree@123";

const TABLES_TO_CLEAR = [
  T.saleReturnItems,
  T.saleReturns,
  T.investmentAllocations,
  T.investments,
  T.investors,
  T.accountTransfers,
  T.profitWithdrawals,
  T.accountLedger,
  T.expenses,
  T.payments,
  T.partyLedger,
  T.purchaseItems,
  T.purchases,
  T.saleItems,
  T.sales,
  T.stockAdjustments,
  T.inventoryLedger,
  T.productVariants,
  T.products,
  T.parties,
  T.expenseCategories,
  T.productCategories,
  T.salePaymentMethods,
  T.accounts,
  T.settings,
] as const;

async function seedDefaults() {
  await pool.query(
    `INSERT INTO ${T.settings} (id, business_name, currency, low_stock_default, date_calendar) VALUES ($1, $2, $3, $4, $5)`,
    [uuidv4(), "COUNTER", "Rs.", 5, "BS"]
  );

  await pool.query(`
    INSERT INTO ${T.accounts} (name, account_type, opening_balance) VALUES
      ('Cash', 'cash', 0),
      ('Bank', 'bank', 0),
      ('eSewa', 'digital', 0),
      ('Khalti', 'digital', 0)
    ON CONFLICT (name) DO NOTHING
  `);

  await pool.query(`
    INSERT INTO ${T.salePaymentMethods} (name) VALUES
      ('Cash'), ('COD'), ('eSewa'), ('Khalti'), ('Bank Transfer')
    ON CONFLICT (name) DO NOTHING
  `);

  await pool.query(`
    UPDATE ${T.salePaymentMethods} pm
    SET account_id = a.id
    FROM ${T.accounts} a
    WHERE pm.account_id IS NULL
      AND (
        (pm.name = 'Cash' AND a.name = 'Cash')
        OR (pm.name = 'Bank Transfer' AND a.name = 'Bank')
        OR (pm.name = 'eSewa' AND a.name = 'eSewa')
        OR (pm.name = 'Khalti' AND a.name = 'Khalti')
      )
  `);

  await pool.query(`
    INSERT INTO ${T.expenseCategories} (name) VALUES
      ('Rent'), ('Shipping'), ('Packaging'), ('Marketing'), ('Other')
    ON CONFLICT (name) DO NOTHING
  `);
}

async function upsertAdmin() {
  const email = NEW_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await hashPassword(NEW_ADMIN_PASSWORD);
  const existing = await pool.query(`SELECT id FROM ${T.appUser} WHERE email = $1`, [email]);

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE ${T.appUser} SET password_hash = $1, updated_at = NOW() WHERE email = $2`,
      [passwordHash, email]
    );
    console.log(`Updated login for ${email}`);
  } else {
    await pool.query(
      `INSERT INTO ${T.appUser} (id, email, password_hash) VALUES ($1, $2, $3)`,
      [uuidv4(), email, passwordHash]
    );
    console.log(`Created login for ${email}`);
  }
}

async function reset() {
  console.log("Clearing all data (keeping bij_app_user rows)...");

  await pool.query(`TRUNCATE TABLE ${TABLES_TO_CLEAR.join(", ")} RESTART IDENTITY CASCADE`);

  console.log("Seeding default settings, accounts, and categories...");
  await seedDefaults();
  await upsertAdmin();

  console.log("Reset completed.");
  await pool.end();
}

reset().catch((err) => {
  console.error("Reset failed:", err.message);
  process.exit(1);
});
