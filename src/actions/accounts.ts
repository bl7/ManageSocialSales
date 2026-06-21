"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { withTransaction, query } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { accountSchema, formatZodErrors } from "@/lib/validators";
import {
  addAccountLedgerEntryClient,
  getAccountLedgerCount,
} from "@/lib/queries/accounts";
import type { ActionResult } from "@/actions/auth";

function parseOptionalUuid(value: FormDataEntryValue | null): string | undefined {
  const s = value as string;
  return s && s.length > 0 ? s : undefined;
}

export async function saveAccountAction(
  _prev: ActionResult | { success: true; id: string } | null,
  formData: FormData
): Promise<ActionResult | { success: true; id: string }> {
  await requireUser();

  const accountId = formData.get("account_id") as string | null;
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    account_type: formData.get("account_type"),
    opening_balance: formData.get("opening_balance") ?? 0,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    if (accountId) {
      await withTransaction(async (client) => {
        const existing = await client.query(
          `SELECT opening_balance FROM ${T.accounts} WHERE id = $1`,
          [accountId]
        );
        const oldOpening = Number(existing.rows[0]?.opening_balance ?? 0);
        const newOpening = parsed.data.opening_balance;
        const diff = newOpening - oldOpening;

        await client.query(
          `UPDATE ${T.accounts}
           SET name = $1, account_type = $2, opening_balance = $3, updated_at = NOW()
           WHERE id = $4`,
          [parsed.data.name, parsed.data.account_type, newOpening, accountId]
        );

        if (diff !== 0) {
          await addAccountLedgerEntryClient(client, {
            accountId,
            entryDate: new Date().toISOString().slice(0, 10),
            entryType: "opening_adjustment",
            amount: diff,
            referenceType: "account",
            referenceId: accountId,
            notes: "Opening balance adjusted",
          });
        }
      });

      revalidatePath("/settings");
      revalidatePath("/dashboard");
      return { success: true, id: accountId };
    }

    const id = uuidv4();
    await query(
      `INSERT INTO ${T.accounts} (id, name, account_type, opening_balance)
       VALUES ($1, $2, $3, $4)`,
      [id, parsed.data.name, parsed.data.account_type, parsed.data.opening_balance]
    );

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { success: false, error: "Account name already exists" };
    }
    return { success: false, error: "Failed to save account" };
  }
}

export async function deleteAccountAction(accountId: string): Promise<ActionResult> {
  await requireUser();

  try {
    const ledgerCount = await getAccountLedgerCount(accountId);
    if (ledgerCount > 0) {
      return { success: false, error: "Cannot delete an account with transactions. Deactivate it instead." };
    }

    await query(
      `UPDATE ${T.accounts} SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [accountId]
    );
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to deactivate account" };
  }
}
