"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/actions/auth";
import { settingsSchema, formatZodErrors } from "@/lib/validators";
import { query } from "@/lib/db";
import { T } from "@/lib/tables";
import type { ActionResult } from "@/actions/auth";

export async function updateSettingsAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const parsed = settingsSchema.safeParse({
    business_name: formData.get("business_name"),
    currency: formData.get("currency"),
    low_stock_default: formData.get("low_stock_default"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    business_email: formData.get("business_email") || undefined,
    logo_url: formData.get("logo_url") || undefined,
    invoice_prefix: formData.get("invoice_prefix") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await query(
      `UPDATE ${T.settings} SET business_name=$1, currency=$2, low_stock_default=$3,
       phone=$4, address=$5, business_email=$6, logo_url=$7, invoice_prefix=$8, updated_at=NOW()
       WHERE id = (SELECT id FROM ${T.settings} LIMIT 1)`,
      [
        parsed.data.business_name,
        parsed.data.currency,
        parsed.data.low_stock_default,
        parsed.data.phone || null,
        parsed.data.address || null,
        parsed.data.business_email || null,
        parsed.data.logo_url || null,
        parsed.data.invoice_prefix || "INV-",
      ]
    );
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update settings" };
  }
}
