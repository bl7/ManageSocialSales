"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { withTransaction, query } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { expenseSchema, formatZodErrors } from "@/lib/validators";
import { addAccountLedgerEntryClient } from "@/lib/queries/accounts";
import type { ActionResult } from "@/actions/auth";

export async function recordExpenseAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const parsed = expenseSchema.safeParse({
    expense_date: formData.get("expense_date"),
    category_id: formData.get("category_id"),
    amount: formData.get("amount"),
    party_id: formData.get("party_id") || undefined,
    account_id: formData.get("account_id"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await withTransaction(async (client) => {
      const expenseId = uuidv4();
      await client.query(
        `INSERT INTO ${T.expenses} (id, expense_date, category_id, amount, party_id, account_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          expenseId,
          parsed.data.expense_date,
          parsed.data.category_id,
          parsed.data.amount,
          parsed.data.party_id || null,
          parsed.data.account_id,
          parsed.data.notes || null,
        ]
      );

      await addAccountLedgerEntryClient(client, {
        accountId: parsed.data.account_id,
        entryDate: parsed.data.expense_date,
        entryType: "expense",
        amount: -parsed.data.amount,
        referenceType: "expense",
        referenceId: expenseId,
        notes: parsed.data.notes,
      });
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to record expense" };
  }
}
