"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveInvestorAction } from "@/actions/investors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";

interface Props {
  investor?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
  };
}

export function InvestorForm({ investor }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveInvestorAction, null);

  useEffect(() => {
    if (state && "id" in state && state.success) {
      toast.success(investor ? "Investor updated" : "Investor added");
      router.push("/investment?tab=investors");
      router.refresh();
    }
  }, [state, router, investor]);

  return (
    <div>
      <PageHeader
        title={investor ? "Edit Investor" : "Add Investor"}
        description="Manage partner or owner details for investment tracking"
      />

      <form action={action} className="max-w-lg">
        {investor && <input type="hidden" name="investor_id" value={investor.id} />}
        {state && !state.success && <div className="mb-4"><ErrorMessage message={state.error} /></div>}

        <fieldset disabled={pending} className="space-y-4 rounded-xl border border-border bg-card p-5 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={investor?.name ?? ""} />
          </FormGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={investor?.phone ?? ""} />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={investor?.email ?? ""} />
            </FormGroup>
          </div>
          <FormGroup>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={investor?.address ?? ""} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={investor?.notes ?? ""} />
          </FormGroup>
          <div className="flex gap-3">
            <Button type="submit">{pending ? "Saving..." : investor ? "Update" : "Add Investor"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
