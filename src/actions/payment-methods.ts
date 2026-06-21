"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { T } from "@/lib/tables";
import { getDefaultCashAccountId } from "@/lib/queries/accounts";
import { requireUser } from "@/actions/auth";
import { salePaymentMethodSchema, formatZodErrors } from "@/lib/validators";
import type { ActionResult } from "@/actions/auth";

export async function quickCreatePaymentMethodAction(
  name: string
): Promise<{ id: string; name: string } | ActionResult> {
  await requireUser();

  const parsed = salePaymentMethodSchema.safeParse({ name: name.trim() });
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const existing = await query<{ id: string; name: string }>(
      `SELECT id, name FROM ${T.salePaymentMethods} WHERE LOWER(name) = LOWER($1) AND is_active = true`,
      [parsed.data.name]
    );
    if (existing[0]) return { id: existing[0].id, name: existing[0].name };

    const id = uuidv4();
    const cashAccountId = await getDefaultCashAccountId();
    await query(
      `INSERT INTO ${T.salePaymentMethods} (id, name, account_id) VALUES ($1, $2, $3)`,
      [id, parsed.data.name, cashAccountId]
    );
    revalidatePath("/payment-methods");
    revalidatePath("/sales/new");
    return { id, name: parsed.data.name };
  } catch {
    return { success: false, error: "Failed to create payment method" };
  }
}

export async function savePaymentMethodAction(
  _prev: ActionResult | { success: true; id: string } | null,
  formData: FormData
): Promise<ActionResult | { success: true; id: string }> {
  await requireUser();

  const methodId = formData.get("method_id") as string | null;
  const parsed = salePaymentMethodSchema.safeParse({
    name: formData.get("name"),
    account_id: formData.get("account_id") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const accountId = parsed.data.account_id || null;

    if (methodId) {
      await query(
        `UPDATE ${T.salePaymentMethods} SET name = $1, account_id = $2, updated_at = NOW() WHERE id = $3`,
        [parsed.data.name, accountId, methodId]
      );
      revalidatePath("/payment-methods");
      revalidatePath("/sales/new");
      return { success: true, id: methodId };
    }

    const id = uuidv4();
    const defaultAccountId = accountId || (await getDefaultCashAccountId());
    await query(
      `INSERT INTO ${T.salePaymentMethods} (id, name, account_id) VALUES ($1, $2, $3)`,
      [id, parsed.data.name, defaultAccountId]
    );
    revalidatePath("/payment-methods");
    revalidatePath("/sales/new");
    return { success: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { success: false, error: "Payment method already exists" };
    }
    return { success: false, error: "Failed to save payment method" };
  }
}

export async function deletePaymentMethodAction(methodId: string): Promise<ActionResult> {
  await requireUser();

  try {
    await query(
      `UPDATE ${T.sales} SET payment_method_id = NULL WHERE payment_method_id = $1`,
      [methodId]
    );
    await query(
      `UPDATE ${T.salePaymentMethods} SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [methodId]
    );
    revalidatePath("/payment-methods");
    revalidatePath("/sales/new");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete payment method" };
  }
}
