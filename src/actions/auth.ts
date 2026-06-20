"use server";

import { redirect } from "next/navigation";
import {
  createSessionToken,
  verifyPassword,
  hashPassword,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
} from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { T } from "@/lib/tables";
import { loginSchema, formatZodErrors } from "@/lib/validators";
import type { AppUser } from "@/types";

export type ActionResult = { success: true } | { success: false; error: string };

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  const user = await queryOne<AppUser>(
    `SELECT * FROM ${T.appUser} WHERE email = $1`,
    [parsed.data.email.toLowerCase()]
  );

  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  const valid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) {
    return { success: false, error: "Invalid email or password" };
  }

  const token = await createSessionToken(user.id);
  await setSessionCookie(token);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
