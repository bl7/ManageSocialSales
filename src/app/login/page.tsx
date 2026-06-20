"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage, FormGroup, Label } from "@/components/ui/page";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-background to-slate-100 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="bg-primary px-8 py-6 text-center text-primary-foreground">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
            S
          </div>
          <h1 className="text-2xl font-bold">Shree Inventory</h1>
          <p className="mt-1 text-sm text-teal-100">Manage your business smarter</p>
        </div>

        <form action={action} className="space-y-4 p-8">
          {state && !state.success && <ErrorMessage message={state.error} />}

          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </FormGroup>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
