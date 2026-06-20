"use server";

import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { withTransaction } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { productSchema, formatZodErrors } from "@/lib/validators";
import type { ActionResult } from "@/actions/auth";

export async function saveProductAction(
  _prev: ActionResult | { success: true; id: string } | null,
  formData: FormData
): Promise<ActionResult | { success: true; id: string }> {
  await requireUser();

  const productId = formData.get("product_id") as string | null;
  const variantsJson = formData.get("variants") as string;

  let variants;
  try {
    variants = JSON.parse(variantsJson);
  } catch {
    return { success: false, error: "Invalid variant data" };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    category: formData.get("category") || undefined,
    brand: formData.get("brand") || undefined,
    supplier: formData.get("supplier") || undefined,
    description: formData.get("description") || undefined,
    variants,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const id = await withTransaction(async (client) => {
      let pid = productId;

      if (pid) {
        await client.query(
          `UPDATE ${T.products} SET name=$1, sku=$2, category=$3, brand=$4,
           supplier=$5, description=$6, updated_at=NOW() WHERE id=$7`,
          [
            parsed.data.name,
            parsed.data.sku || null,
            parsed.data.category || null,
            parsed.data.brand || null,
            parsed.data.supplier || null,
            parsed.data.description || null,
            pid,
          ]
        );
      } else {
        pid = uuidv4();
        await client.query(
          `INSERT INTO ${T.products} (id, name, sku, category, brand, supplier, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            pid,
            parsed.data.name,
            parsed.data.sku || null,
            parsed.data.category || null,
            parsed.data.brand || null,
            parsed.data.supplier || null,
            parsed.data.description || null,
          ]
        );
      }

      if (pid) {
        const ids = parsed.data.variants.filter((v) => v.id).map((v) => v.id!);
        if (ids.length > 0) {
          await client.query(
            `UPDATE ${T.productVariants} SET is_active = false
             WHERE product_id = $1 AND id != ALL($2::uuid[])`,
            [pid, ids]
          );
        }
      }

      for (const v of parsed.data.variants) {
        if (v.id) {
          await client.query(
            `UPDATE ${T.productVariants} SET size=$1, color=$2, default_cost_price=$3,
             default_selling_price=$4, reorder_level=$5, is_active=true, updated_at=NOW()
             WHERE id=$6 AND product_id=$7`,
            [v.size, v.color, v.default_cost_price, v.default_selling_price, v.reorder_level, v.id, pid]
          );
        } else {
          await client.query(
            `INSERT INTO ${T.productVariants}
             (id, product_id, size, color, default_cost_price, default_selling_price, reorder_level)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [uuidv4(), pid, v.size, v.color, v.default_cost_price, v.default_selling_price, v.reorder_level]
          );
        }
      }

      return pid!;
    });

    redirect(`/products/${id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save product";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { success: false, error: "SKU or variant combination already exists" };
    }
    return { success: false, error: "Failed to save product. Please try again." };
  }
}
