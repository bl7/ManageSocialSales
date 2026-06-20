"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";

interface SettingsFormProps {
  settings: {
    business_name: string;
    currency: string;
    low_stock_default: number;
    phone?: string | null;
    address?: string | null;
    business_email?: string | null;
    logo_url?: string | null;
    invoice_prefix?: string | null;
  };
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, action, pending] = useActionState(updateSettingsAction, null);

  useEffect(() => {
    if (state?.success) toast.success("Settings saved successfully");
  }, [state]);

  return (
    <div>
      <PageHeader title="Settings" description="Business profile and preferences" />

      <form action={action} className="max-w-lg">
        {state && !state.success && <div className="mb-4"><ErrorMessage message={state.error} /></div>}

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold">Business Profile</h3>
            <FormGroup>
              <Label htmlFor="business_name">Business Name</Label>
              <Input id="business_name" name="business_name" required defaultValue={settings.business_name} />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="business_email">Business Email</Label>
              <Input id="business_email" name="business_email" type="email" defaultValue={settings.business_email || ""} />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={settings.phone || ""} placeholder="+977..." />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" defaultValue={settings.address || ""} />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input id="logo_url" name="logo_url" type="url" defaultValue={settings.logo_url || ""} placeholder="https://..." />
            </FormGroup>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold">Invoicing</h3>
            <FormGroup>
              <Label htmlFor="invoice_prefix">Invoice Number Prefix</Label>
              <Input id="invoice_prefix" name="invoice_prefix" defaultValue={settings.invoice_prefix || "INV-"} />
            </FormGroup>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold">Preferences</h3>
            <FormGroup>
              <Label htmlFor="currency">Currency Symbol</Label>
              <Input id="currency" name="currency" required defaultValue={settings.currency} placeholder="Rs." />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="low_stock_default">Default Low Stock Threshold</Label>
              <Input id="low_stock_default" name="low_stock_default" type="number" min="0" required
                defaultValue={settings.low_stock_default} />
            </FormGroup>
          </div>
        </div>

        <div className="mt-6">
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Settings"}</Button>
        </div>
      </form>
    </div>
  );
}
