"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage, FormGroup, Label } from "@/components/ui/page";

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
    date_calendar: "AD" | "BS";
  };
  section: "profile" | "invoice" | "preferences";
}

export function SettingsForm({ settings, section }: SettingsFormProps) {
  const [state, action, pending] = useActionState(updateSettingsAction, null);

  useEffect(() => {
    if (state?.success) toast.success("Settings saved successfully");
  }, [state]);

  const hidden = (name: string, value: string | number) => (
    <input key={name} type="hidden" name={name} value={value} />
  );

  return (
    <form action={action} className="max-w-lg">
      {state && !state.success && <div className="mb-4"><ErrorMessage message={state.error} /></div>}

      {section !== "profile" && (
        <>
          {hidden("business_name", settings.business_name)}
          {hidden("business_email", settings.business_email || "")}
          {hidden("phone", settings.phone || "")}
          {hidden("address", settings.address || "")}
          {hidden("logo_url", settings.logo_url || "")}
        </>
      )}
      {section !== "invoice" && hidden("invoice_prefix", settings.invoice_prefix || "INV-")}
      {section !== "preferences" && (
        <>
          {hidden("currency", settings.currency)}
          {hidden("low_stock_default", settings.low_stock_default)}
          {hidden("date_calendar", settings.date_calendar)}
        </>
      )}

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        {section === "profile" && (
          <>
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
          </>
        )}
        {section === "invoice" && (
          <FormGroup>
            <Label htmlFor="invoice_prefix">Invoice Number Prefix</Label>
            <Input id="invoice_prefix" name="invoice_prefix" defaultValue={settings.invoice_prefix || "INV-"} />
          </FormGroup>
        )}
        {section === "preferences" && (
          <>
            <FormGroup>
              <Label htmlFor="currency">Currency Symbol</Label>
              <Input id="currency" name="currency" required defaultValue={settings.currency} placeholder="Rs." />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="low_stock_default">Default Low Stock Threshold</Label>
              <Input id="low_stock_default" name="low_stock_default" type="number" min="0" required defaultValue={settings.low_stock_default} />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="date_calendar">Date calendar</Label>
              <select
                id="date_calendar"
                name="date_calendar"
                defaultValue={settings.date_calendar}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <option value="BS">Bikram Sambat (BS)</option>
                <option value="AD">Gregorian (AD)</option>
              </select>
              <p className="mt-1 text-xs text-muted">Controls how dates appear across the app.</p>
            </FormGroup>
          </>
        )}
      </div>

      <div className="mt-6">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}
