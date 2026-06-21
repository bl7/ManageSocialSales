"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { savePaymentMethodAction, deletePaymentMethodAction } from "@/actions/payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";

interface PaymentMethodFormProps {
  method?: { id: string; name: string; account_id?: string | null };
  saleCount?: number;
  accounts: { id: string; name: string }[];
}

export function PaymentMethodForm({ method, saleCount = 0, accounts }: PaymentMethodFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (method?.id) formData.set("method_id", method.id);

    const result = await savePaymentMethodAction(null, formData);
    if (result && "id" in result && result.success) {
      toast.success("Payment method saved");
      router.push("/settings?tab=payment-methods");
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!method || !confirm(`Delete "${method.name}"?`)) return;
    setDeleting(true);
    const result = await deletePaymentMethodAction(method.id);
    if (result.success) {
      toast.success("Payment method deleted");
      router.push("/settings?tab=payment-methods");
      return;
    }
    toast.error(result.error);
    setDeleting(false);
  }

  return (
    <div>
      <PageHeader
        title={method ? "Edit Payment Method" : "Add Payment Method"}
        description="Options like Cash, COD, eSewa for sales"
      />

      <form onSubmit={handleSubmit} className="max-w-lg">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending || deleting} className="rounded-xl border border-border bg-card p-5 space-y-4 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={method?.name} placeholder="e.g. COD" />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="account_id">Deposits into account</Label>
            <Select id="account_id" name="account_id" defaultValue={method?.account_id ?? ""}>
              <option value="">None (cash only when paid — uses Cash default)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-muted">Leave empty for COD. Paid amount still defaults to Cash if unset.</p>
          </FormGroup>
          {method && saleCount > 0 && (
            <p className="text-sm text-muted">{saleCount} sale(s) use this method.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit">{pending ? "Saving..." : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            {method && (
              <Button type="button" variant="outline" className="text-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </fieldset>
      </form>
    </div>
  );
}
