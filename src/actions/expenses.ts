"use server";

import { v4 as uuidv4 } from "uuid";
import { query } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { expenseSchema, formatZodErrors } from "@/lib/validators";
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
    payment_method: formData.get("payment_method") || "cash",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await query(
      `INSERT INTO ${T.expenses} (id, expense_date, category_id, amount, party_id, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(),
        parsed.data.expense_date,
        parsed.data.category_id,
        parsed.data.amount,
        parsed.data.party_id || null,
        parsed.data.payment_method,
        parsed.data.notes || null,
      ]
    );
    return { success: true };
  } catch {
    return { success: false, error: "Failed to record expense" };
  }
}
