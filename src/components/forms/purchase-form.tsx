"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordPurchaseAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VariantPicker } from "@/components/ui/variant-picker";
import { CreatableSelect, type CreatableOption } from "@/components/ui/creatable-select";
import { quickCreatePartyAction } from "@/actions/parties";
import { Select } from "@/components/ui/select";
import { AccountSelect } from "@/components/ui/account-select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";
import { formatCurrency } from "@/lib/utils";
import { todayISODate } from "@/lib/date-ranges";

interface Variant {
  id: string;
  product_name: string;
  size: string;
  color: string;
  current_stock: number;
  default_selling_price: string;
}

interface LineItem {
  variant_id: string;
  quantity: number;
  unit_cost: number;
}

interface PurchaseFormProps {
  variants: Variant[];
  currency?: string;
  lastSupplier?: string | null;
  supplierSuggestions?: string[];
  suppliers?: { id: string; name: string; phone?: string | null }[];
  accounts?: { id: string; name: string }[];
}

export function PurchaseForm({
  variants,
  currency = "Rs.",
  lastSupplier,
  supplierSuggestions = [],
  suppliers = [],
  accounts = [],
}: PurchaseFormProps) {
  const router = useRouter();
  const today = todayISODate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<LineItem[]>([{ variant_id: "", quantity: 1, unit_cost: 0 }]);
  const [partyId, setPartyId] = useState("");
  const [supplierOptions, setSupplierOptions] = useState<CreatableOption[]>(() =>
    suppliers.map((s) => ({ id: s.id, label: s.name, hint: s.phone || undefined }))
  );
  const [paymentMode, setPaymentMode] = useState<"paid" | "credit" | "partial">("paid");
  const [amountPaid, setAmountPaid] = useState(0);
  const [dueDate, setDueDate] = useState("");

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0);
  const effectivePaid = paymentMode === "paid" ? total : paymentMode === "credit" ? 0 : amountPaid;
  const creditDue = Math.max(0, total - effectivePaid);

  async function handleCreateSupplier(name: string) {
    const result = await quickCreatePartyAction(name, "supplier");
    if ("success" in result && result.success === false) {
      toast.error(result.error);
      return null;
    }
    if ("id" in result) {
      toast.success(`Supplier "${result.name}" added`);
      return { id: result.id, label: result.name, hint: result.phone || undefined };
    }
    return null;
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { variant_id: "", quantity: 1, unit_cost: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    for (const item of items) {
      if (!item.variant_id) {
        setError("Please select a product variant for every line item.");
        setPending(false);
        return;
      }
    }
    if ((paymentMode === "credit" || paymentMode === "partial") && !partyId) {
      setError("Select a supplier for credit or partial payment.");
      setPending(false);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("items", JSON.stringify(items));
    formData.set("amount_paid", String(effectivePaid));

    const result = await recordPurchaseAction(null, formData);
    if (result?.success) {
      toast.success("Purchase recorded successfully");
      form.reset();
      setItems([{ variant_id: "", quantity: 1, unit_cost: 0 }]);
      setPending(false);
      router.refresh();
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader title="Record Purchase" description="Add incoming stock from suppliers" />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending} className="disabled:opacity-60">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormGroup>
                <Label htmlFor="purchase_date">Purchase Date *</Label>
                <NepaliDateInput id="purchase_date" name="purchase_date" required defaultValue={today} />
              </FormGroup>
            <FormGroup>
              <Label htmlFor="supplier">Supplier name</Label>
              <Input
                id="supplier"
                name="supplier"
                list="supplier-suggestions"
                defaultValue={lastSupplier ?? ""}
              />
              <datalist id="supplier-suggestions">
                {supplierSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </FormGroup>
            <FormGroup className="sm:col-span-2">
              <Label>Supplier party (for credit tracking)</Label>
              <CreatableSelect
                name="party_id"
                value={partyId}
                onChange={setPartyId}
                options={supplierOptions}
                onOptionsChange={setSupplierOptions}
                onCreate={handleCreateSupplier}
                placeholder="Search or add supplier..."
                createLabel={(q) => `Add supplier "${q}"`}
              />
            </FormGroup>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label htmlFor="payment_mode">Payment</Label>
              <Select
                id="payment_mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as "paid" | "credit" | "partial")}
              >
                <option value="paid">Full payment</option>
                <option value="credit">Full credit (udhar)</option>
                <option value="partial">Partial payment</option>
              </Select>
            </FormGroup>
            {paymentMode === "partial" && (
              <FormGroup>
                <Label htmlFor="amount_paid_input">Amount Paid</Label>
                <Input
                  id="amount_paid_input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amountPaid || ""}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                />
              </FormGroup>
            )}
            {(paymentMode === "credit" || paymentMode === "partial") && (
              <FormGroup>
                <Label htmlFor="due_date">Due Date</Label>
                <NepaliDateInput id="due_date" name="due_date" value={dueDate || today} onChange={setDueDate} />
              </FormGroup>
            )}
            {(paymentMode === "paid" || paymentMode === "partial") && accounts.length > 0 && (
              <AccountSelect accounts={accounts} label="Paid from account" />
            )}
          </div>
          {creditDue > 0 && (
            <p className="text-sm font-medium text-warning">Credit due: {formatCurrency(creditDue, currency)}</p>
          )}
          <FormGroup>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </FormGroup>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>Add Item</Button>
            </div>

            {items.map((item, i) => (
              <div key={i} className="mb-4 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-4">
                <FormGroup className="sm:col-span-2">
                  <Label>Product / Variant *</Label>
                  <VariantPicker
                    variants={variants}
                    value={item.variant_id}
                    onChange={(id) => updateItem(i, "variant_id", id)}
                    showStock={false}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Quantity *</Label>
                  <Input type="number" min="1" required value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} />
                </FormGroup>
                <FormGroup>
                  <Label>Unit Cost *</Label>
                  <Input type="number" min="0" step="0.01" required value={item.unit_cost}
                    onChange={(e) => updateItem(i, "unit_cost", parseFloat(e.target.value) || 0)} />
                </FormGroup>
                <div className="flex items-end justify-between sm:col-span-4">
                  <span className="text-sm text-muted">
                    Line total: {formatCurrency(item.quantity * item.unit_cost, currency)}
                  </span>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>Remove</Button>
                  )}
                </div>
              </div>
            ))}

            <div className="mt-4 text-right text-lg font-bold">Total: {formatCurrency(total, currency)}</div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Record Purchase"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
