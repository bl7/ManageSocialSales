"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/actions/auth";
import {
  purchaseSchema,
  saleSchema,
  adjustmentSchema,
  formatZodErrors,
} from "@/lib/validators";
import {
  recordPurchase,
  recordSale,
  recordAdjustment,
} from "@/lib/queries/inventory";
import type { ActionResult } from "@/actions/auth";

export async function recordPurchaseAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  let items;
  try {
    items = JSON.parse(formData.get("items") as string);
  } catch {
    return { success: false, error: "Invalid items data" };
  }

  const parsed = purchaseSchema.safeParse({
    purchase_date: formData.get("purchase_date"),
    supplier: formData.get("supplier") || undefined,
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await recordPurchase(
      parsed.data.purchase_date,
      parsed.data.supplier,
      parsed.data.notes,
      parsed.data.items.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
      }))
    );
    redirect("/ledger");
  } catch {
    return { success: false, error: "Failed to record purchase. Please try again." };
  }
}

export async function recordSaleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  let items;
  try {
    items = JSON.parse(formData.get("items") as string);
  } catch {
    return { success: false, error: "Invalid items data" };
  }

  const parsed = saleSchema.safeParse({
    sale_date: formData.get("sale_date"),
    platform: formData.get("platform") || "Instagram",
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await recordSale(
      parsed.data.sale_date,
      parsed.data.platform,
      parsed.data.notes,
      parsed.data.items.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
        unit_sale_price: i.unit_sale_price,
      }))
    );
    redirect("/ledger");
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("Insufficient stock")) {
      return { success: false, error: message };
    }
    return { success: false, error: "Failed to record sale. Please try again." };
  }
}

export async function recordAdjustmentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const parsed = adjustmentSchema.safeParse({
    adjustment_date: formData.get("adjustment_date"),
    variant_id: formData.get("variant_id"),
    quantity_change: formData.get("quantity_change"),
    reason: formData.get("reason"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await recordAdjustment(
      parsed.data.adjustment_date,
      parsed.data.variant_id,
      parsed.data.quantity_change,
      parsed.data.reason,
      parsed.data.notes
    );
    redirect("/ledger");
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("negative stock")) {
      return { success: false, error: message };
    }
    return { success: false, error: "Failed to record adjustment. Please try again." };
  }
}
