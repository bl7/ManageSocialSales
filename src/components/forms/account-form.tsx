"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveAccountAction, deleteAccountAction } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { formatCurrency } from "@/lib/utils";

interface AccountFormProps {
  account?: {
    id: string;
    name: string;
    account_type: string;
    opening_balance: string;
    current_balance?: number;
  };
  currency?: string;
  ledgerCount?: number;
}

export function AccountForm({ account, currency = "Rs.", ledgerCount = 0 }: AccountFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (account?.id) formData.set("account_id", account.id);

    const result = await saveAccountAction(null, formData);
    if (result && "id" in result && result.success) {
      toast.success("Account saved");
      router.push("/settings?tab=accounts");
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!account || !confirm(`Deactivate "${account.name}"?`)) return;
    setDeleting(true);
    const result = await deleteAccountAction(account.id);
    if (result.success) {
      toast.success("Account deactivated");
      router.push("/settings?tab=accounts");
      return;
    }
    toast.error(result.error);
    setDeleting(false);
  }

  return (
    <div>
      <PageHeader
        title={account ? "Edit Account" : "Add Account"}
        description="Cash, bank, and digital wallets for money tracking"
      />

      <form onSubmit={handleSubmit} className="max-w-lg">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending || deleting} className="space-y-4 rounded-xl border border-border bg-card p-5 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={account?.name} placeholder="e.g. Cash, Bank" />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="account_type">Type *</Label>
            <Select id="account_type" name="account_type" defaultValue={account?.account_type ?? "cash"}>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="digital">Digital (eSewa, Khalti, etc.)</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="opening_balance">Opening Balance</Label>
            <MoneyInput
              id="opening_balance"
              name="opening_balance"
              defaultValue={account?.opening_balance ?? "0"}
            />
            {account && ledgerCount > 0 && (
              <p className="mt-1 text-xs text-muted">
                Changing this posts an adjustment. Current balance: {formatCurrency(account.current_balance ?? 0, currency)}
              </p>
            )}
          </FormGroup>
          <div className="flex flex-wrap gap-3">
            <Button type="submit">{pending ? "Saving..." : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            {account && (
              <Button type="button" variant="outline" className="text-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deactivating..." : "Deactivate"}
              </Button>
            )}
          </div>
        </fieldset>
      </form>
    </div>
  );
}
