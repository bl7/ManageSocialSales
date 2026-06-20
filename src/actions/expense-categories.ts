"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { T } from "@/lib/tables";
import { requireUser } from "@/actions/auth";
import { productCategorySchema, formatZodErrors } from "@/lib/validators";
import type { ActionResult } from "@/actions/auth";

const expenseCategorySchema = productCategorySchema;

export async function quickCreateExpenseCategoryAction(
  name: string
): Promise<{ id: string; name: string } | ActionResult> {
  await requireUser();
  const parsed = expenseCategorySchema.safeParse({ name: name.trim() });
  if (!parsed.success) return { success: false, error: formatZodErrors(parsed.error) };

  try {
    const existing = await query<{ id: string; name: string }>(
      `SELECT id, name FROM ${T.expenseCategories} WHERE LOWER(name) = LOWER($1) AND is_active = true`,
      [parsed.data.name]
    );
    if (existing[0]) return existing[0];

    const id = uuidv4();
    await query(`INSERT INTO ${T.expenseCategories} (id, name) VALUES ($1, $2)`, [id, parsed.data.name]);
    revalidatePath("/settings");
    revalidatePath("/expenses");
    return { id, name: parsed.data.name };
  } catch {
    return { success: false, error: "Failed to create category" };
  }
}

export async function saveExpenseCategoryAction(
  _prev: ActionResult | { success: true; id: string } | null,
  formData: FormData
): Promise<ActionResult | { success: true; id: string }> {
  await requireUser();
  const categoryId = formData.get("category_id") as string | null;
  const parsed = expenseCategorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { success: false, error: formatZodErrors(parsed.error) };

  try {
    if (categoryId) {
      await query(`UPDATE ${T.expenseCategories} SET name = $1 WHERE id = $2`, [parsed.data.name, categoryId]);
      revalidatePath("/settings");
      return { success: true, id: categoryId };
    }
    const id = uuidv4();
    await query(`INSERT INTO ${T.expenseCategories} (id, name) VALUES ($1, $2)`, [id, parsed.data.name]);
    revalidatePath("/settings");
    return { success: true, id };
  } catch {
    return { success: false, error: "Failed to save category" };
  }
}

export async function deleteExpenseCategoryAction(categoryId: string): Promise<ActionResult> {
  await requireUser();
  try {
    await query(`UPDATE ${T.expenseCategories} SET is_active = false WHERE id = $1`, [categoryId]);
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete category" };
  }
}
