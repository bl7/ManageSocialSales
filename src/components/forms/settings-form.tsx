"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";

interface SettingsFormProps {
  settings: {
    business_name: string;
    currency: string;
    low_stock_default: number;
  };
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, action, pending] = useActionState(updateSettingsAction, null);

  return (
    <div>
      <PageHeader title="Settings" description="Business preferences" />

      <form action={action} className="max-w-md">
        {state && !state.success && <div className="mb-4"><ErrorMessage message={state.error} /></div>}
        {state?.success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Settings saved successfully.
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <FormGroup>
            <Label htmlFor="business_name">Business Name</Label>
            <Input id="business_name" name="business_name" required defaultValue={settings.business_name} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="currency">Currency Symbol</Label>
            <Input id="currency" name="currency" required defaultValue={settings.currency} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="low_stock_default">Default Low Stock Threshold</Label>
            <Input id="low_stock_default" name="low_stock_default" type="number" min="0" required
              defaultValue={settings.low_stock_default} />
          </FormGroup>
        </div>

        <div className="mt-6">
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Settings"}</Button>
        </div>
      </form>
    </div>
  );
}
