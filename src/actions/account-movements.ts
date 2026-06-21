"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import type { PoolClient } from "pg";
import { withTransaction } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import {
  accountTransferSchema,
  profitWithdrawalSchema,
  formatZodErrors,
} from "@/lib/validators";
import {
  addAccountLedgerEntryClient,
  getAccountBalanceClient,
} from "@/lib/queries/accounts";
import type { ActionResult } from "@/actions/auth";

export async function recordTransferAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const parsed = accountTransferSchema.safeParse({
    from_account_id: formData.get("from_account_id"),
    to_account_id: formData.get("to_account_id"),
    amount: formData.get("amount"),
    transfer_date: formData.get("transfer_date"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await withTransaction(async (client) => {
      const balance = await getAccountBalanceClient(client, parsed.data.from_account_id);
      if (balance < parsed.data.amount) {
        throw new Error("Insufficient balance in source account");
      }

      const transferId = uuidv4();
      await client.query(
        `INSERT INTO ${T.accountTransfers}
         (id, from_account_id, to_account_id, amount, transfer_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          transferId,
          parsed.data.from_account_id,
          parsed.data.to_account_id,
          parsed.data.amount,
          parsed.data.transfer_date,
          parsed.data.notes || null,
        ]
      );

      const note = parsed.data.notes || "Account transfer";
      await addAccountLedgerEntryClient(client, {
        accountId: parsed.data.from_account_id,
        entryDate: parsed.data.transfer_date,
        entryType: "transfer_out",
        amount: -parsed.data.amount,
        referenceType: "transfer",
        referenceId: transferId,
        notes: note,
      });
      await addAccountLedgerEntryClient(client, {
        accountId: parsed.data.to_account_id,
        entryDate: parsed.data.transfer_date,
        entryType: "transfer_in",
        amount: parsed.data.amount,
        referenceType: "transfer",
        referenceId: transferId,
        notes: note,
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to record transfer";
    return { success: false, error: msg };
  }
}

export async function recordProfitWithdrawalAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const parsed = profitWithdrawalSchema.safeParse({
    investor_id: formData.get("investor_id") || undefined,
    account_id: formData.get("account_id"),
    amount: formData.get("amount"),
    withdrawal_date: formData.get("withdrawal_date"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await withTransaction(async (client) => {
      const balance = await getAccountBalanceClient(client, parsed.data.account_id);
      if (balance < parsed.data.amount) {
        throw new Error("Insufficient balance in account");
      }

      const withdrawalId = uuidv4();
      let note = parsed.data.notes || "Profit withdrawal";
      if (parsed.data.investor_id) {
        const inv = await client.query(
          `SELECT name FROM ${T.investors} WHERE id = $1`,
          [parsed.data.investor_id]
        );
        const name = inv.rows[0]?.name as string | undefined;
        if (name) note = `${name} — ${note}`;
      }

      await client.query(
        `INSERT INTO ${T.profitWithdrawals}
         (id, investor_id, account_id, amount, withdrawal_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          withdrawalId,
          parsed.data.investor_id || null,
          parsed.data.account_id,
          parsed.data.amount,
          parsed.data.withdrawal_date,
          parsed.data.notes || null,
        ]
      );

      await addAccountLedgerEntryClient(client, {
        accountId: parsed.data.account_id,
        entryDate: parsed.data.withdrawal_date,
        entryType: "profit_withdrawal",
        amount: -parsed.data.amount,
        referenceType: "profit_withdrawal",
        referenceId: withdrawalId,
        notes: note,
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/investment");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to record withdrawal";
    return { success: false, error: msg };
  }
}
