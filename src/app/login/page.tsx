"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { PLATFORM_TAGLINE } from "@/lib/branding";
import { AppLogo } from "@/components/branding/app-logo";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-background to-slate-100 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="bg-primary px-8 py-6 text-center text-primary-foreground">
          <AppLogo variant="white" size="logo" className="mx-auto mb-3 h-16 w-auto max-w-[220px]" />
          <p className="text-sm text-teal-100">{PLATFORM_TAGLINE}</p>
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
