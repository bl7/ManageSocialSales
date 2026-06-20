import type { PoolClient } from "pg";
import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";

export type PartyType = "customer" | "supplier" | "both";
export type LedgerEntryType = "sale" | "purchase" | "payment_in" | "payment_out" | "opening";

export interface PartyRow {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  party_type: PartyType;
  opening_balance: string;
  notes: string | null;
  is_active: boolean;
  current_balance?: number;
}

export async function getParties(filters?: { type?: string; search?: string }) {
  const conditions = ["is_active = true"];
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.type && filters.type !== "all") {
    if (filters.type === "customer") {
      conditions.push(`party_type IN ('customer', 'both')`);
    } else if (filters.type === "supplier") {
      conditions.push(`party_type IN ('supplier', 'both')`);
    }
  }
  if (filters?.search) {
    conditions.push(`(name ILIKE $${idx} OR phone ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const rows = await query<PartyRow>(`
    SELECT p.*,
      COALESCE(
        (SELECT balance_after FROM ${T.partyLedger} pl
         WHERE pl.party_id = p.id ORDER BY pl.created_at DESC LIMIT 1),
        p.opening_balance
      ) AS current_balance
    FROM ${T.parties} p
    WHERE ${conditions.join(" AND ")}
    ORDER BY p.name
  `, params);

  return rows.map((r) => ({
    ...r,
    current_balance: Number((r as PartyRow & { current_balance: string }).current_balance ?? 0),
  }));
}

export async function getPartiesForSelect(type: "customer" | "supplier") {
  const typeFilter =
    type === "customer"
      ? `party_type IN ('customer', 'both')`
      : `party_type IN ('supplier', 'both')`;
  return query<{ id: string; name: string; phone: string | null }>(`
    SELECT id, name, phone FROM ${T.parties}
    WHERE is_active = true AND ${typeFilter}
    ORDER BY name
  `);
}

export async function getPartyById(id: string) {
  const row = await queryOne<PartyRow>(`SELECT * FROM ${T.parties} WHERE id = $1`, [id]);
  if (!row) return null;
  const balance = await getCurrentPartyBalance(id);
  return { ...row, current_balance: balance };
}

export async function getCurrentPartyBalance(partyId: string): Promise<number> {
  const last = await queryOne<{ balance_after: string }>(
    `SELECT balance_after FROM ${T.partyLedger}
     WHERE party_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [partyId]
  );
  if (last) return Number(last.balance_after);
  const party = await queryOne<{ opening_balance: string }>(
    `SELECT opening_balance FROM ${T.parties} WHERE id = $1`,
    [partyId]
  );
  return Number(party?.opening_balance ?? 0);
}

export async function getPartyBalanceClient(client: PoolClient, partyId: string): Promise<number> {
  const last = await client.query(
    `SELECT balance_after FROM ${T.partyLedger}
     WHERE party_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [partyId]
  );
  if (last.rows[0]) return Number(last.rows[0].balance_after);
  const party = await client.query(
    `SELECT opening_balance FROM ${T.parties} WHERE id = $1`,
    [partyId]
  );
  return Number(party.rows[0]?.opening_balance ?? 0);
}

export async function addPartyLedgerEntryClient(
  client: PoolClient,
  data: {
    partyId: string;
    entryDate: string;
    entryType: LedgerEntryType;
    amount: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }
): Promise<void> {
  const current = await getPartyBalanceClient(client, data.partyId);
  let balanceAfter = current;
  if (["sale", "purchase", "opening"].includes(data.entryType)) {
    balanceAfter = current + data.amount;
  } else {
    balanceAfter = current - data.amount;
  }

  await client.query(
    `INSERT INTO ${T.partyLedger}
     (id, party_id, entry_date, entry_type, reference_type, reference_id, amount, balance_after, notes)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      data.partyId,
      data.entryDate,
      data.entryType,
      data.referenceType || null,
      data.referenceId || null,
      data.amount,
      balanceAfter,
      data.notes || null,
    ]
  );
}

export async function getPartyLedger(partyId: string) {
  return query<{
    id: string;
    entry_date: string;
    entry_type: string;
    amount: string;
    balance_after: string;
    notes: string | null;
    created_at: string;
  }>(`
    SELECT * FROM ${T.partyLedger}
    WHERE party_id = $1
    ORDER BY entry_date DESC, created_at DESC
  `, [partyId]);
}

export async function getOutstandingReceivables() {
  return query<{ id: string; name: string; phone: string | null; party_type: string; current_balance: string }>(`
    SELECT p.id, p.name, p.phone, p.party_type,
      COALESCE(
        (SELECT balance_after FROM ${T.partyLedger} pl
         WHERE pl.party_id = p.id ORDER BY pl.created_at DESC LIMIT 1),
        p.opening_balance
      ) AS current_balance
    FROM ${T.parties} p
    WHERE p.is_active = true
      AND p.party_type IN ('customer', 'both')
      AND COALESCE(
        (SELECT balance_after FROM ${T.partyLedger} pl
         WHERE pl.party_id = p.id ORDER BY pl.created_at DESC LIMIT 1),
        p.opening_balance
      ) > 0
    ORDER BY current_balance DESC
  `).then((rows) =>
    rows.map((r) => ({ ...r, current_balance: Number(r.current_balance) }))
  );
}

export async function getOutstandingPayables() {
  return query<{ id: string; name: string; phone: string | null; party_type: string; current_balance: string }>(`
    SELECT p.id, p.name, p.phone, p.party_type,
      COALESCE(
        (SELECT balance_after FROM ${T.partyLedger} pl
         WHERE pl.party_id = p.id ORDER BY pl.created_at DESC LIMIT 1),
        p.opening_balance
      ) AS current_balance
    FROM ${T.parties} p
    WHERE p.is_active = true
      AND p.party_type IN ('supplier', 'both')
      AND COALESCE(
        (SELECT balance_after FROM ${T.partyLedger} pl
         WHERE pl.party_id = p.id ORDER BY pl.created_at DESC LIMIT 1),
        p.opening_balance
      ) > 0
    ORDER BY current_balance DESC
  `).then((rows) =>
    rows.map((r) => ({ ...r, current_balance: Number(r.current_balance) }))
  );
}

export async function getTotalReceivables(): Promise<number> {
  const rows = await query<{ party_type: string; balance: string }>(`
    SELECT p.party_type,
      COALESCE(
        (SELECT balance_after FROM ${T.partyLedger} pl
         WHERE pl.party_id = p.id ORDER BY pl.created_at DESC LIMIT 1),
        p.opening_balance
      ) AS balance
    FROM ${T.parties} p
    WHERE p.is_active = true
      AND p.party_type IN ('customer', 'both')
  `);
  return rows.reduce((s, r) => {
    const b = Number(r.balance);
    return b > 0 ? s + b : s;
  }, 0);
}

export async function getTotalPayables(): Promise<number> {
  const rows = await query<{ balance: string }>(`
    SELECT COALESCE(
      (SELECT balance_after FROM ${T.partyLedger} pl
       WHERE pl.party_id = p.id ORDER BY pl.created_at DESC LIMIT 1),
      p.opening_balance
    ) AS balance
    FROM ${T.parties} p
    WHERE p.is_active = true
      AND p.party_type IN ('supplier', 'both')
  `);
  return rows.reduce((s, r) => {
    const b = Number(r.balance);
    return b > 0 ? s + b : s;
  }, 0);
}

export async function reserveInvoiceNumberClient(client: PoolClient): Promise<string> {
  const result = await client.query(`
    UPDATE ${T.settings}
    SET next_invoice_number = next_invoice_number + 1, updated_at = NOW()
    WHERE id = (SELECT id FROM ${T.settings} LIMIT 1)
    RETURNING invoice_prefix, next_invoice_number - 1 AS num
  `);
  const prefix = result.rows[0]?.invoice_prefix ?? "INV-";
  const num = result.rows[0]?.num ?? 1;
  return `${prefix}${String(num).padStart(4, "0")}`;
}

export function derivePaymentStatus(total: number, amountPaid: number): "paid" | "partial" | "unpaid" {
  if (amountPaid >= total) return "paid";
  if (amountPaid <= 0) return "unpaid";
  return "partial";
}
