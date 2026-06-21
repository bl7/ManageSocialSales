"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { withTransaction, query } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { investorSchema, formatZodErrors } from "@/lib/validators";
import type { ActionResult } from "@/actions/auth";

export async function saveInvestorAction(
  _prev: ActionResult | { success: true; id: string } | null,
  formData: FormData
): Promise<ActionResult | { success: true; id: string }> {
  await requireUser();

  const investorId = formData.get("investor_id") as string | null;
  const parsed = investorSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const id = await withTransaction(async (client) => {
      if (investorId) {
        await client.query(
          `UPDATE ${T.investors}
           SET name=$1, phone=$2, email=$3, address=$4, notes=$5, updated_at=NOW()
           WHERE id=$6`,
          [
            parsed.data.name,
            parsed.data.phone || null,
            parsed.data.email || null,
            parsed.data.address || null,
            parsed.data.notes || null,
            investorId,
          ]
        );
        return investorId;
      }

      const newId = uuidv4();
      await client.query(
        `INSERT INTO ${T.investors} (id, name, phone, email, address, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          newId,
          parsed.data.name,
          parsed.data.phone || null,
          parsed.data.email || null,
          parsed.data.address || null,
          parsed.data.notes || null,
        ]
      );
      return newId;
    });

    revalidatePath("/investment");
    return { success: true, id };
  } catch {
    return { success: false, error: "Failed to save investor" };
  }
}

export async function deleteInvestorAction(investorId: string): Promise<ActionResult> {
  await requireUser();

  try {
    const linked = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM ${T.investments} WHERE investor_id = $1`,
      [investorId]
    );
    if (Number(linked[0]?.count ?? 0) > 0) {
      return { success: false, error: "Cannot delete investor with investment records. Deactivate instead." };
    }

    await query(`UPDATE ${T.investors} SET is_active = false, updated_at = NOW() WHERE id = $1`, [investorId]);
    revalidatePath("/investment");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to deactivate investor" };
  }
}

export async function quickCreateInvestorAction(
  name: string
): Promise<{ id: string; name: string } | ActionResult> {
  await requireUser();

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Name is required" };

  try {
    const existing = await query<{ id: string; name: string }>(
      `SELECT id, name FROM ${T.investors}
       WHERE LOWER(name) = LOWER($1) AND is_active = true`,
      [trimmed]
    );
    if (existing[0]) return existing[0];

    const id = uuidv4();
    await query(`INSERT INTO ${T.investors} (id, name) VALUES ($1, $2)`, [id, trimmed]);
    revalidatePath("/investment");
    return { id, name: trimmed };
  } catch {
    return { success: false, error: "Failed to create investor" };
  }
}
