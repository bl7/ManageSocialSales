import type { PoolClient } from "pg";
import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";

export type AccountType = "cash" | "bank" | "digital";
export type AccountEntryType =
  | "opening_adjustment"
  | "sale_received"
  | "purchase_paid"
  | "expense"
  | "payment_in"
  | "payment_out"
  | "investment"
  | "investment_void"
  | "sale_void"
  | "purchase_void"
  | "transfer_in"
  | "transfer_out"
  | "profit_withdrawal"
  | "sale_refund";

export interface AccountRow {
  id: string;
  name: string;
  account_type: AccountType;
  opening_balance: string;
  is_active: boolean;
  current_balance?: number;
}

export async function getAccounts(activeOnly = true) {
  const filter = activeOnly ? "WHERE a.is_active = true" : "";
  const rows = await query<AccountRow & { current_balance: string }>(`
    SELECT a.*,
      COALESCE(
        (SELECT balance_after FROM ${T.accountLedger} al
         WHERE al.account_id = a.id ORDER BY al.created_at DESC LIMIT 1),
        a.opening_balance
      ) AS current_balance
    FROM ${T.accounts} a
    ${filter}
    ORDER BY a.name
  `);
  return rows.map((r) => ({
    ...r,
    current_balance: Number(r.current_balance ?? 0),
  }));
}

export async function getAccountById(id: string) {
  const row = await queryOne<AccountRow>(`SELECT * FROM ${T.accounts} WHERE id = $1`, [id]);
  if (!row) return null;
  const balance = await getAccountBalance(id);
  return { ...row, current_balance: balance };
}

export async function getAccountBalance(accountId: string): Promise<number> {
  const last = await queryOne<{ balance_after: string }>(
    `SELECT balance_after FROM ${T.accountLedger}
     WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [accountId]
  );
  if (last) return Number(last.balance_after);
  const account = await queryOne<{ opening_balance: string }>(
    `SELECT opening_balance FROM ${T.accounts} WHERE id = $1`,
    [accountId]
  );
  return Number(account?.opening_balance ?? 0);
}

export async function getAccountBalanceClient(client: PoolClient, accountId: string): Promise<number> {
  const last = await client.query(
    `SELECT balance_after FROM ${T.accountLedger}
     WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [accountId]
  );
  if (last.rows[0]) return Number(last.rows[0].balance_after);
  const account = await client.query(
    `SELECT opening_balance FROM ${T.accounts} WHERE id = $1`,
    [accountId]
  );
  return Number(account.rows[0]?.opening_balance ?? 0);
}

export async function getDefaultCashAccountIdClient(client: PoolClient): Promise<string> {
  const result = await client.query(
    `SELECT id FROM ${T.accounts} WHERE name = 'Cash' AND is_active = true LIMIT 1`
  );
  if (!result.rows[0]) throw new Error("Default Cash account not found. Check Settings → Accounts.");
  return result.rows[0].id as string;
}

export async function getDefaultCashAccountId(): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM ${T.accounts} WHERE name = 'Cash' AND is_active = true LIMIT 1`
  );
  if (!row) throw new Error("Default Cash account not found. Check Settings → Accounts.");
  return row.id;
}

export async function resolveAccountIdForSaleClient(
  client: PoolClient,
  paymentMethodId: string | null | undefined,
  amountPaid: number
): Promise<string | null> {
  if (amountPaid <= 0) return null;

  if (paymentMethodId) {
    const result = await client.query(
      `SELECT account_id FROM ${T.salePaymentMethods} WHERE id = $1`,
      [paymentMethodId]
    );
    const accountId = result.rows[0]?.account_id as string | null;
    if (accountId) return accountId;
  }

  return getDefaultCashAccountIdClient(client);
}

export async function resolveAccountIdForOutflowClient(
  client: PoolClient,
  accountId: string | null | undefined,
  amount: number
): Promise<string | null> {
  if (amount <= 0) return null;
  if (accountId) return accountId;
  return getDefaultCashAccountIdClient(client);
}

export async function addAccountLedgerEntryClient(
  client: PoolClient,
  data: {
    accountId: string;
    entryDate: string;
    entryType: AccountEntryType;
    amount: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }
): Promise<void> {
  const current = await getAccountBalanceClient(client, data.accountId);
  const balanceAfter = current + data.amount;

  await client.query(
    `INSERT INTO ${T.accountLedger}
     (id, account_id, entry_date, entry_type, amount, reference_type, reference_id, notes, balance_after)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      data.accountId,
      data.entryDate,
      data.entryType,
      data.amount,
      data.referenceType || null,
      data.referenceId || null,
      data.notes || null,
      balanceAfter,
    ]
  );
}

export async function getTotalAccountBalance(): Promise<number> {
  const accounts = await getAccounts(true);
  return accounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);
}

export async function getAccountLedgerCount(accountId: string) {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM ${T.accountLedger} WHERE account_id = $1`,
    [accountId]
  );
  return Number(row?.count ?? 0);
}

export interface AccountTransactionRow {
  id: string;
  entry_date: string;
  entry_type: AccountEntryType;
  amount: string;
  balance_after: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  account_id: string;
  account_name: string;
  party_id?: string | null;
}

const ENTRY_TYPE_LABELS: Record<AccountEntryType, string> = {
  opening_adjustment: "Opening adjustment",
  sale_received: "Sale received",
  purchase_paid: "Purchase paid",
  expense: "Expense",
  payment_in: "Payment in",
  payment_out: "Payment out",
  investment: "Investment",
  investment_void: "Investment void",
  sale_void: "Sale void",
  purchase_void: "Purchase void",
  transfer_in: "Transfer in",
  transfer_out: "Transfer out",
  profit_withdrawal: "Profit withdrawal",
  sale_refund: "Sale refund",
};

export function getAccountEntryLabel(entryType: string): string {
  return ENTRY_TYPE_LABELS[entryType as AccountEntryType] ?? entryType;
}

export async function getAccountTransactions(filters?: {
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  direction?: "in" | "out" | "all";
  limit?: number;
}) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.dateFrom) {
    conditions.push(`al.entry_date >= $${idx}`);
    params.push(filters.dateFrom);
    idx++;
  }
  if (filters?.dateTo) {
    conditions.push(`al.entry_date <= $${idx}`);
    params.push(filters.dateTo);
    idx++;
  }
  if (filters?.accountId) {
    conditions.push(`al.account_id = $${idx}`);
    params.push(filters.accountId);
    idx++;
  }
  if (filters?.direction === "in") {
    conditions.push(`al.amount > 0`);
  } else if (filters?.direction === "out") {
    conditions.push(`al.amount < 0`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters?.limit ?? 200;

  return query<AccountTransactionRow>(`
    SELECT al.*, a.name AS account_name, pay.party_id
    FROM ${T.accountLedger} al
    JOIN ${T.accounts} a ON a.id = al.account_id
    LEFT JOIN ${T.payments} pay ON pay.id = al.reference_id AND al.reference_type = 'payment'
    ${where}
    ORDER BY al.entry_date DESC, al.created_at DESC
    LIMIT ${limit}
  `, params);
}

export async function getAccountTransactionsSummary(dateFrom?: string, dateTo?: string, accountId?: string) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (dateFrom) {
    conditions.push(`entry_date >= $${idx}`);
    params.push(dateFrom);
    idx++;
  }
  if (dateTo) {
    conditions.push(`entry_date <= $${idx}`);
    params.push(dateTo);
    idx++;
  }
  if (accountId) {
    conditions.push(`account_id = $${idx}`);
    params.push(accountId);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const row = await queryOne<{ money_in: string; money_out: string; count: string }>(`
    SELECT
      COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)::numeric AS money_in,
      COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)::numeric AS money_out,
      COUNT(*)::int AS count
    FROM ${T.accountLedger}
    ${where}
  `, params);

  const moneyIn = Number(row?.money_in ?? 0);
  const moneyOut = Number(row?.money_out ?? 0);

  return {
    money_in: moneyIn,
    money_out: moneyOut,
    net: moneyIn - moneyOut,
    count: Number(row?.count ?? 0),
  };
}

export async function getCashflowChartData(days = 7) {
  const rows = await query<{ date: string; money_in: string; money_out: string }>(`
    SELECT
      al.entry_date::text AS date,
      COALESCE(SUM(CASE WHEN al.amount > 0 THEN al.amount ELSE 0 END), 0)::numeric AS money_in,
      COALESCE(SUM(CASE WHEN al.amount < 0 THEN ABS(al.amount) ELSE 0 END), 0)::numeric AS money_out
    FROM ${T.accountLedger} al
    WHERE al.entry_date >= CURRENT_DATE - ($1::int - 1)
    GROUP BY al.entry_date
    ORDER BY al.entry_date ASC
  `, [days]);

  const map = new Map(rows.map((r) => [r.date, r]));
  const result: { date: string; money_in: number; money_out: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toISODateLocal(d);
    const row = map.get(key);
    result.push({
      date: key,
      money_in: Number(row?.money_in ?? 0),
      money_out: Number(row?.money_out ?? 0),
    });
  }

  return result;
}

function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTransactionLink(
  referenceType: string | null,
  referenceId: string | null,
  partyId?: string | null
): string | null {
  if (referenceType === "payment" && partyId) return `/parties/${partyId}`;
  if (!referenceType || !referenceId) return null;
  if (referenceType === "sale") return `/sales/${referenceId}`;
  if (referenceType === "purchase") return `/purchases/${referenceId}`;
  if (referenceType === "expense") return "/expenses";
  if (referenceType === "investment") return "/investment";
  if (referenceType === "transfer") return "/transactions";
  if (referenceType === "profit_withdrawal") return "/transactions";
  if (referenceType === "payment") return null;
  return null;
}
