"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import type { PoolClient } from "pg";
import { withTransaction } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { investmentSchema, formatZodErrors } from "@/lib/validators";
import { addAccountLedgerEntryClient } from "@/lib/queries/accounts";
import type { ActionResult } from "@/actions/auth";

async function reverseInvestmentLedger(
  client: PoolClient,
  investmentId: string,
  entryDate: string
) {
  const result = await client.query(
    `SELECT account_id, amount FROM ${T.investmentAllocations} WHERE investment_id = $1`,
    [investmentId]
  );
  for (const row of result.rows) {
    await addAccountLedgerEntryClient(client, {
      accountId: row.account_id as string,
      entryDate,
      entryType: "investment_void",
      amount: -Number(row.amount),
      referenceType: "investment",
      referenceId: investmentId,
      notes: "Investment reversed",
    });
  }
}

async function applyInvestmentLedger(
  client: PoolClient,
  investmentId: string,
  entryDate: string,
  allocations: { account_id: string; amount: number }[],
  notes?: string
) {
  for (const row of allocations) {
    await addAccountLedgerEntryClient(client, {
      accountId: row.account_id,
      entryDate,
      entryType: "investment",
      amount: row.amount,
      referenceType: "investment",
      referenceId: investmentId,
      notes,
    });
  }
}

async function getInvestorName(client: PoolClient, investorId: string) {
  const result = await client.query(
    `SELECT name FROM ${T.investors} WHERE id = $1`,
    [investorId]
  );
  return result.rows[0]?.name as string | undefined;
}

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
    investor_id: formData.get("investor_id"),
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
      const investorName = await getInvestorName(client, parsed.data.investor_id);
      const primaryAccountId = parsed.data.allocations[0]?.account_id ?? null;

      await client.query(
        `INSERT INTO ${T.investments}
         (id, investor_id, investor_name, investment_date, amount, account_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          investmentId,
          parsed.data.investor_id,
          investorName ?? "Unknown",
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
      }

      await applyInvestmentLedger(
        client,
        investmentId,
        parsed.data.investment_date,
        parsed.data.allocations,
        parsed.data.notes
      );
    });

    revalidatePath("/investment");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to record investment" };
  }
}

export async function updateInvestmentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const investmentId = formData.get("investment_id") as string;
  if (!investmentId) return { success: false, error: "Investment not found" };

  let allocations;
  try {
    allocations = JSON.parse(formData.get("allocations") as string);
  } catch {
    return { success: false, error: "Invalid allocation data" };
  }

  const parsed = investmentSchema.safeParse({
    investor_id: formData.get("investor_id"),
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
      await reverseInvestmentLedger(client, investmentId, parsed.data.investment_date);

      const investorName = await getInvestorName(client, parsed.data.investor_id);
      const primaryAccountId = parsed.data.allocations[0]?.account_id ?? null;

      await client.query(
        `UPDATE ${T.investments}
         SET investor_id=$1, investor_name=$2, investment_date=$3, amount=$4, account_id=$5, notes=$6
         WHERE id=$7`,
        [
          parsed.data.investor_id,
          investorName ?? "Unknown",
          parsed.data.investment_date,
          total,
          primaryAccountId,
          parsed.data.notes || null,
          investmentId,
        ]
      );

      await client.query(
        `DELETE FROM ${T.investmentAllocations} WHERE investment_id = $1`,
        [investmentId]
      );

      for (const row of parsed.data.allocations) {
        await client.query(
          `INSERT INTO ${T.investmentAllocations} (id, investment_id, account_id, amount)
           VALUES ($1, $2, $3, $4)`,
          [uuidv4(), investmentId, row.account_id, row.amount]
        );
      }

      await applyInvestmentLedger(
        client,
        investmentId,
        parsed.data.investment_date,
        parsed.data.allocations,
        parsed.data.notes
      );
    });

    revalidatePath("/investment");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update investment" };
  }
}

export async function deleteInvestmentAction(investmentId: string): Promise<ActionResult> {
  await requireUser();

  try {
    await withTransaction(async (client) => {
      const inv = await client.query(
        `SELECT investment_date FROM ${T.investments} WHERE id = $1`,
        [investmentId]
      );
      if (!inv.rows[0]) throw new Error("Investment not found");

      await reverseInvestmentLedger(
        client,
        investmentId,
        inv.rows[0].investment_date as string
      );

      await client.query(`DELETE FROM ${T.investments} WHERE id = $1`, [investmentId]);
    });

    revalidatePath("/investment");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete investment" };
  }
}
