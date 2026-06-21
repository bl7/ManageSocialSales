"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { withTransaction } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { investmentSchema, formatZodErrors } from "@/lib/validators";
import { addAccountLedgerEntryClient } from "@/lib/queries/accounts";
import type { ActionResult } from "@/actions/auth";

export async function recordInvestmentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  let allocations;
  try {
    allocations = JSON.parse(formData.get("allocations") as string);
  } catch {
    return { success: false, error: "Invalid allocation data" };
  }

  const parsed = investmentSchema.safeParse({
    investor_name: formData.get("investor_name"),
    investment_date: formData.get("investment_date"),
    notes: formData.get("notes") || undefined,
    allocations,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  const total = parsed.data.allocations.reduce((sum, row) => sum + row.amount, 0);

  try {
    await withTransaction(async (client) => {
      const investmentId = uuidv4();
      const primaryAccountId = parsed.data.allocations[0]?.account_id ?? null;

      await client.query(
        `INSERT INTO ${T.investments} (id, investor_name, investment_date, amount, account_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          investmentId,
          parsed.data.investor_name,
          parsed.data.investment_date,
          total,
          primaryAccountId,
          parsed.data.notes || null,
        ]
      );

      for (const row of parsed.data.allocations) {
        await client.query(
          `INSERT INTO ${T.investmentAllocations} (id, investment_id, account_id, amount)
           VALUES ($1, $2, $3, $4)`,
          [uuidv4(), investmentId, row.account_id, row.amount]
        );

        await addAccountLedgerEntryClient(client, {
          accountId: row.account_id,
          entryDate: parsed.data.investment_date,
          entryType: "investment",
          amount: row.amount,
          referenceType: "investment",
          referenceId: investmentId,
          notes: parsed.data.notes,
        });
      }
    });

    revalidatePath("/investment");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to record investment" };
  }
}
