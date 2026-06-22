"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/actions/auth";
import {
  purchaseSchema,
  saleSchema,
  saleReturnSchema,
  adjustmentSchema,
  formatZodErrors,
} from "@/lib/validators";
import {
  recordPurchase,
  recordSale,
  recordSaleReturn,
  recordAdjustment,
  voidSale,
  voidPurchase,
} from "@/lib/queries/inventory";
import type { ActionResult } from "@/actions/auth";

function parseOptionalUuid(value: FormDataEntryValue | null): string | undefined {
  const s = value as string;
  return s && s.length > 0 ? s : undefined;
}

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
    party_id: formData.get("party_id") || undefined,
    amount_paid: formData.get("amount_paid") ?? undefined,
    due_date: formData.get("due_date") || undefined,
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await recordPurchase(
      parsed.data.purchase_date,
      parsed.data.notes,
      parsed.data.items.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
      })),
      {
        partyId: parseOptionalUuid(formData.get("party_id")),
        amountPaid: parsed.data.amount_paid,
        dueDate: parsed.data.due_date,
        accountId: parseOptionalUuid(formData.get("account_id")),
      }
    );
    revalidatePath("/purchases");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
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
    party_id: formData.get("party_id") || undefined,
    payment_method_id: formData.get("payment_method_id") || undefined,
    delivery_charge: formData.get("delivery_charge") ?? 0,
    amount_paid: formData.get("amount_paid") ?? undefined,
    due_date: formData.get("due_date") || undefined,
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
      })),
      {
        partyId: parseOptionalUuid(formData.get("party_id")),
        paymentMethodId: parseOptionalUuid(formData.get("payment_method_id")),
        deliveryCharge: parsed.data.delivery_charge,
        amountPaid: parsed.data.amount_paid,
        dueDate: parsed.data.due_date,
      }
    );
    revalidatePath("/sales");
    revalidatePath("/pos");
    revalidatePath("/quick-entry");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("Insufficient stock")) {
      return { success: false, error: message };
    }
    return { success: false, error: "Failed to record sale. Please try again." };
  }
}

export async function voidSaleAction(saleId: string, voidReason: string): Promise<ActionResult> {
  await requireUser();
  if (!voidReason.trim()) return { success: false, error: "Reason is required" };
  try {
    await voidSale(saleId, voidReason.trim());
    revalidatePath("/sales");
    revalidatePath("/pos");
    revalidatePath("/ledger");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("already voided") || message.includes("not found")) {
      return { success: false, error: message };
    }
    return { success: false, error: "Failed to void sale" };
  }
}

export async function recordSaleReturnAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  let items: { sale_item_id: string; quantity: number }[] = [];
  try {
    items = JSON.parse(String(formData.get("items") || "[]"));
  } catch {
    return { success: false, error: "Invalid return items" };
  }

  const parsed = saleReturnSchema.safeParse({
    sale_id: formData.get("sale_id"),
    return_date: formData.get("return_date"),
    account_id: formData.get("account_id") || "",
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const id = await recordSaleReturn(
      parsed.data.sale_id,
      parsed.data.return_date,
      parsed.data.items,
      {
        accountId: parsed.data.account_id || undefined,
        notes: parsed.data.notes,
      }
    );
    revalidatePath(`/sales/${parsed.data.sale_id}`);
    revalidatePath("/sales");
    revalidatePath("/ledger");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/parties");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message) return { success: false, error: message };
    return { success: false, error: "Failed to record return" };
  }
}

export async function voidPurchaseAction(purchaseId: string, voidReason: string): Promise<ActionResult> {
  await requireUser();
  if (!voidReason.trim()) return { success: false, error: "Reason is required" };
  try {
    await voidPurchase(purchaseId, voidReason.trim());
    revalidatePath("/purchases");
    revalidatePath("/ledger");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("already voided") || message.includes("not found") || message.includes("negative")) {
      return { success: false, error: message };
    }
    return { success: false, error: "Failed to void purchase" };
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
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("negative stock")) {
      return { success: false, error: message };
    }
    return { success: false, error: "Failed to record adjustment. Please try again." };
  }
}
