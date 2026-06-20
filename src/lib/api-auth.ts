import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function requireApiAuth() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
