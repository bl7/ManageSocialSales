"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { savePartyAction } from "@/actions/parties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";

interface PartyFormProps {
  party?: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    party_type: string;
    notes: string | null;
  };
}

export function PartyForm({ party }: PartyFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (party?.id) formData.set("party_id", party.id);

    const result = await savePartyAction(null, formData);
    if (result && "id" in result && result.success) {
      toast.success("Party saved");
      router.push(`/parties/${result.id}`);
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={party ? "Edit Party" : "Add Party"}
        description="Customer, supplier, or both"
      />

      <form onSubmit={handleSubmit} className="max-w-lg">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending} className="rounded-xl border border-border bg-card p-5 space-y-4 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={party?.name} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="party_type">Type *</Label>
            <Select id="party_type" name="party_type" defaultValue={party?.party_type || "customer"}>
              <option value="customer">Customer</option>
              <option value="supplier">Supplier</option>
              <option value="both">Both</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={party?.phone || ""} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" defaultValue={party?.address || ""} />
          </FormGroup>
          {!party && (
            <FormGroup>
              <Label htmlFor="opening_balance">Opening Balance (udhar)</Label>
              <Input id="opening_balance" name="opening_balance" type="number" min="0" step="0.01" defaultValue="0" />
            </FormGroup>
          )}
          <FormGroup>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={party?.notes || ""} />
          </FormGroup>
          <Button type="submit">{pending ? "Saving..." : "Save Party"}</Button>
        </fieldset>
      </form>
    </div>
  );
}
