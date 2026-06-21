"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { productCategorySchema, formatZodErrors } from "@/lib/validators";
import type { ActionResult } from "@/actions/auth";

export async function quickCreateCategoryAction(
  name: string,
): Promise<{ id: string; name: string } | ActionResult> {
  await requireUser();

  const parsed = productCategorySchema.safeParse({ name: name.trim() });
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const existing = await query<{ id: string; name: string }>(
      `SELECT id, name FROM ${T.productCategories} WHERE LOWER(name) = LOWER($1) AND is_active = true`,
      [parsed.data.name],
    );
    if (existing[0]) return { id: existing[0].id, name: existing[0].name };

    const id = uuidv4();
    await query(
      `INSERT INTO ${T.productCategories} (id, name) VALUES ($1, $2)`,
      [id, parsed.data.name],
    );
    revalidatePath("/categories");
    revalidatePath("/products");
    return { id, name: parsed.data.name };
  } catch {
    return { success: false, error: "Failed to create category" };
  }
}

export async function saveCategoryAction(
  _prev: ActionResult | { success: true; id: string } | null,
  formData: FormData,
): Promise<ActionResult | { success: true; id: string }> {
  await requireUser();

  const categoryId = formData.get("category_id") as string | null;
  const parsed = productCategorySchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    if (categoryId) {
      await query(
        `UPDATE ${T.productCategories} SET name = $1, updated_at = NOW() WHERE id = $2`,
        [parsed.data.name, categoryId],
      );
      revalidatePath("/categories");
      revalidatePath("/products");
      return { success: true, id: categoryId };
    }

    const id = uuidv4();
    await query(
      `INSERT INTO ${T.productCategories} (id, name) VALUES ($1, $2)`,
      [id, parsed.data.name],
    );
    revalidatePath("/categories");
    revalidatePath("/products");
    return { success: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { success: false, error: "Category name already exists" };
    }
    return { success: false, error: "Failed to save category" };
  }
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<ActionResult> {
  await requireUser();

  try {
    await query(
      `UPDATE ${T.products} SET category_id = NULL WHERE category_id = $1`,
      [categoryId],
    );
    await query(
      `UPDATE ${T.productCategories} SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [categoryId],
    );
    revalidatePath("/categories");
    revalidatePath("/products");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete category" };
  }
}
