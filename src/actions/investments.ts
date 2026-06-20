"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { investmentSchema, formatZodErrors } from "@/lib/validators";
import type { ActionResult } from "@/actions/auth";

export async function recordInvestmentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const parsed = investmentSchema.safeParse({
    investor_name: formData.get("investor_name"),
    investment_date: formData.get("investment_date"),
    amount: formData.get("amount"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await query(
      `INSERT INTO ${T.investments} (id, investor_name, investment_date, amount, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        uuidv4(),
        parsed.data.investor_name,
        parsed.data.investment_date,
        parsed.data.amount,
        parsed.data.notes || null,
      ]
    );
    revalidatePath("/investment");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to record investment" };
  }
}
