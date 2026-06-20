"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { withTransaction, query } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { partySchema, paymentSchema, formatZodErrors } from "@/lib/validators";
import { addPartyLedgerEntryClient } from "@/lib/queries/parties";
import { todayISODate } from "@/lib/date-ranges";
import type { ActionResult } from "@/actions/auth";

export async function quickCreatePartyAction(
  name: string,
  partyType: "customer" | "supplier"
): Promise<{ id: string; name: string; phone?: string | null } | ActionResult> {
  await requireUser();

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Name is required" };

  try {
    const existing = await query<{ id: string; name: string; phone: string | null }>(
      `SELECT id, name, phone FROM ${T.parties}
       WHERE LOWER(name) = LOWER($1) AND is_active = true
         AND party_type IN ($2, 'both')`,
      [trimmed, partyType]
    );
    if (existing[0]) return existing[0];

    const id = uuidv4();
    const type = partyType;
    await query(
      `INSERT INTO ${T.parties} (id, name, party_type) VALUES ($1, $2, $3)`,
      [id, trimmed, type]
    );
    revalidatePath("/parties");
    revalidatePath("/sales/new");
    revalidatePath("/purchases/new");
    return { id, name: trimmed, phone: null };
  } catch {
    return { success: false, error: "Failed to create party" };
  }
}

export async function savePartyAction(
  _prev: ActionResult | { success: true; id: string } | null,
  formData: FormData
): Promise<ActionResult | { success: true; id: string }> {
  await requireUser();

  const partyId = formData.get("party_id") as string | null;
  const parsed = partySchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    party_type: formData.get("party_type"),
    opening_balance: formData.get("opening_balance") || 0,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const id = await withTransaction(async (client) => {
      let pid = partyId;

      if (pid) {
        await client.query(
          `UPDATE ${T.parties} SET name=$1, phone=$2, address=$3, party_type=$4, notes=$5, updated_at=NOW()
           WHERE id=$6`,
          [
            parsed.data.name,
            parsed.data.phone || null,
            parsed.data.address || null,
            parsed.data.party_type,
            parsed.data.notes || null,
            pid,
          ]
        );
      } else {
        pid = uuidv4();
        await client.query(
          `INSERT INTO ${T.parties} (id, name, phone, address, party_type, opening_balance, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            pid,
            parsed.data.name,
            parsed.data.phone || null,
            parsed.data.address || null,
            parsed.data.party_type,
            parsed.data.opening_balance,
            parsed.data.notes || null,
          ]
        );

        if (parsed.data.opening_balance > 0) {
          await addPartyLedgerEntryClient(client, {
            partyId: pid,
            entryDate: todayISODate(),
            entryType: "opening",
            amount: parsed.data.opening_balance,
            notes: "Opening balance",
          });
        }
      }

      return pid!;
    });

    return { success: true, id: id! };
  } catch {
    return { success: false, error: "Failed to save party" };
  }
}

export async function recordPaymentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const parsed = paymentSchema.safeParse({
    party_id: formData.get("party_id"),
    payment_date: formData.get("payment_date"),
    amount: formData.get("amount"),
    direction: formData.get("direction"),
    payment_method: formData.get("payment_method") || "cash",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await withTransaction(async (client) => {
      const paymentId = uuidv4();
      await client.query(
        `INSERT INTO ${T.payments}
         (id, party_id, payment_date, amount, direction, payment_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          paymentId,
          parsed.data.party_id,
          parsed.data.payment_date,
          parsed.data.amount,
          parsed.data.direction,
          parsed.data.payment_method,
          parsed.data.notes || null,
        ]
      );

      await addPartyLedgerEntryClient(client, {
        partyId: parsed.data.party_id,
        entryDate: parsed.data.payment_date,
        entryType: parsed.data.direction === "received" ? "payment_in" : "payment_out",
        amount: parsed.data.amount,
        referenceType: "payment",
        referenceId: paymentId,
        notes: parsed.data.notes,
      });
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to record payment" };
  }
}

export async function deactivatePartyAction(partyId: string): Promise<ActionResult> {
  await requireUser();
  try {
    await query(`UPDATE ${T.parties} SET is_active = false, updated_at = NOW() WHERE id = $1`, [partyId]);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to deactivate party" };
  }
}
