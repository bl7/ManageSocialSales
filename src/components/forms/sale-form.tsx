"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordSaleAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { VariantPicker } from "@/components/ui/variant-picker";
import { CreatableSelect, type CreatableOption } from "@/components/ui/creatable-select";
import { quickCreatePartyAction } from "@/actions/parties";
import { quickCreatePaymentMethodAction } from "@/actions/payment-methods";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  unit_sale_price: number;
}

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "WhatsApp", "Walk-in", "Other"];
const MONEY_PATTERN = /^\d*\.?\d{0,2}$/;

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
}

export function SaleForm({
  variants,
  customers = [],
  paymentMethods = [],
  currency = "Rs.",
  compact = false,
}: {
  variants: Variant[];
  customers?: Customer[];
  paymentMethods?: { id: string; name: string }[];
  currency?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const today = todayISODate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([{ variant_id: "", quantity: 1, unit_sale_price: 0 }]);
  const [partyId, setPartyId] = useState("");
  const [customerOptions, setCustomerOptions] = useState<CreatableOption[]>(() =>
    customers.map((c) => ({ id: c.id, label: c.name, hint: c.phone || undefined }))
  );
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<CreatableOption[]>(() =>
    paymentMethods.map((m) => ({ id: m.id, label: m.name }))
  );
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [paymentMode, setPaymentMode] = useState<"paid" | "credit" | "partial">("paid");
  const [amountPaid, setAmountPaid] = useState(0);
  const [dueDate, setDueDate] = useState("");

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_sale_price, 0);
  const total = subtotal + deliveryCharge;
  const effectivePaid = paymentMode === "paid" ? total : paymentMode === "credit" ? 0 : amountPaid;
  const creditDue = Math.max(0, total - effectivePaid);

  async function handleCreatePaymentMethod(name: string) {
    const result = await quickCreatePaymentMethodAction(name);
    if ("success" in result && result.success === false) {
      toast.error(result.error);
      return null;
    }
    if ("id" in result) {
      toast.success(`Payment method "${result.name}" added`);
      return { id: result.id, label: result.name };
    }
    return null;
  }

  async function handleCreateCustomer(name: string) {
    const result = await quickCreatePartyAction(name, "customer");
    if ("success" in result && result.success === false) {
      toast.error(result.error);
      return null;
    }
    if ("id" in result) {
      toast.success(`Customer "${result.name}" added`);
      return { id: result.id, label: result.name, hint: result.phone || undefined };
    }
    return null;
  }

  function getStock(variantId: string) {
    return variants.find((v) => v.id === variantId)?.current_stock ?? 0;
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === "variant_id" && typeof value === "string") {
        const v = variants.find((x) => x.id === value);
        if (v) updated.unit_sale_price = parseFloat(v.default_selling_price) || 0;
      }
      return updated;
    }));
  }

  function addItem() {
    setItems((prev) => [...prev, { variant_id: "", quantity: 1, unit_sale_price: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    for (const item of items) {
      if (!item.variant_id) {
        setError("Please select a product variant for every line item.");
        return false;
      }
      if (!Number.isFinite(item.unit_sale_price) || item.unit_sale_price < 0) {
        setError("Enter a valid sale price for every line item.");
        return false;
      }
      const stock = getStock(item.variant_id);
      if (item.quantity > stock) {
        setError(`Cannot sell ${item.quantity} units. Only ${stock} available.`);
        return false;
      }
    }
    if ((paymentMode === "credit" || paymentMode === "partial") && !partyId) {
      setError("Select a customer for credit or partial payment.");
      return false;
    }
    if (paymentMode === "partial" && (amountPaid <= 0 || amountPaid >= total)) {
      setError("Partial payment must be greater than 0 and less than total.");
      return false;
    }
    if (!Number.isFinite(deliveryCharge) || deliveryCharge < 0) {
      setError("Enter a valid delivery charge.");
      return false;
    }
    setError("");
    return true;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setConfirmOpen(true);
  }

  async function confirmSale() {
    setPending(true);
    setError("");

    const form = document.getElementById("sale-form") as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("items", JSON.stringify(items));
    formData.set("amount_paid", String(effectivePaid));
    formData.set("delivery_charge", String(deliveryCharge));

    const result = await recordSaleAction(null, formData);
    if (result?.success) {
      toast.success(compact ? "Sale recorded" : "POS sale completed");
      form.reset();
      setItems([{ variant_id: "", quantity: 1, unit_sale_price: 0 }]);
      setDeliveryCharge(0);
      setPaymentMethodId("");
      setConfirmOpen(false);
      setPending(false);
      router.refresh();
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setConfirmOpen(false);
      setPending(false);
    }
  }

  return (
    <div>
      {!compact && (
        <PageHeader title="POS" description="Point of sale — record a customer order" />
      )}

      <form id="sale-form" onSubmit={handleSubmit} className={compact ? "max-w-3xl" : "max-w-3xl"}>
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending} className="disabled:opacity-60">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormGroup>
                <Label htmlFor="sale_date">Sale Date *</Label>
                <NepaliDateInput id="sale_date" name="sale_date" required defaultValue={today} />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="platform">Platform</Label>
                <Select id="platform" name="platform" defaultValue="Instagram">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </FormGroup>
            </div>
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

            {items.map((item, i) => {
              const stock = getStock(item.variant_id);
              return (
                <div key={i} className="mb-4 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-4">
                  <FormGroup className="sm:col-span-2">
                    <Label>Product / Variant *</Label>
                    <VariantPicker
                      variants={variants}
                      value={item.variant_id}
                      onChange={(id) => updateItem(i, "variant_id", id)}
                      showStock
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Quantity *</Label>
                    <Input type="number" min="1" max={stock || undefined} required value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} />
                    {item.variant_id && (
                      <p className="mt-1 text-xs text-muted">Available: {stock}</p>
                    )}
                  </FormGroup>
                  <FormGroup>
                    <Label>Sale Price *</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      required
                      value={item.unit_sale_price}
                      onChange={(e) => {
                        const next = e.target.value.trim();
                        if (next === "") {
                          updateItem(i, "unit_sale_price", 0);
                          return;
                        }
                        if (!MONEY_PATTERN.test(next)) return;
                        const parsed = Number(next);
                        if (!Number.isNaN(parsed)) updateItem(i, "unit_sale_price", parsed);
                      }}
                    />
                  </FormGroup>
                  <div className="flex items-end justify-between sm:col-span-4">
                    <span className="text-sm text-muted">
                      Line total: {formatCurrency(item.quantity * item.unit_sale_price, currency)}
                    </span>
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>Remove</Button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="mt-4 space-y-1 text-right">
              <p className="text-sm text-muted">Subtotal: {formatCurrency(subtotal, currency)}</p>
              {deliveryCharge > 0 && (
                <p className="text-sm text-muted">Delivery: {formatCurrency(deliveryCharge, currency)}</p>
              )}
              <p className="text-lg font-bold">Total: {formatCurrency(total, currency)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 font-semibold">Payment & Delivery</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormGroup>
                <Label htmlFor="delivery_charge">Delivery Charge</Label>
                <Input
                  id="delivery_charge"
                  name="delivery_charge"
                  type="text"
                  inputMode="decimal"
                  value={deliveryCharge || ""}
                  onChange={(e) => {
                    const next = e.target.value.trim();
                    if (next === "") {
                      setDeliveryCharge(0);
                      return;
                    }
                    if (!MONEY_PATTERN.test(next)) return;
                    const parsed = Number(next);
                    if (!Number.isNaN(parsed)) setDeliveryCharge(parsed);
                  }}
                />
              </FormGroup>
              <FormGroup>
                <Label>Payment Method</Label>
                <CreatableSelect
                  name="payment_method_id"
                  value={paymentMethodId}
                  onChange={setPaymentMethodId}
                  options={paymentMethodOptions}
                  onOptionsChange={setPaymentMethodOptions}
                  onCreate={handleCreatePaymentMethod}
                  placeholder="Cash, COD, eSewa..."
                  createLabel={(q) => `Add "${q}"`}
                />
              </FormGroup>
              <FormGroup className="sm:col-span-2">
                <Label>Customer (optional for cash)</Label>
                <CreatableSelect
                  name="party_id"
                  value={partyId}
                  onChange={setPartyId}
                  options={customerOptions}
                  onOptionsChange={setCustomerOptions}
                  onCreate={handleCreateCustomer}
                  placeholder="Search or add customer..."
                  createLabel={(q) => `Add customer "${q}"`}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="payment_mode">Payment</Label>
                <Select
                  id="payment_mode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as "paid" | "credit" | "partial")}
                >
                  <option value="paid">Full payment (cash)</option>
                  <option value="credit">Full credit (udhar)</option>
                  <option value="partial">Partial payment</option>
                </Select>
              </FormGroup>
              {paymentMode === "partial" && (
                <FormGroup>
                  <Label htmlFor="amount_paid_input">Amount Paid</Label>
                  <Input
                    id="amount_paid_input"
                    type="text"
                    inputMode="decimal"
                    value={amountPaid || ""}
                    onChange={(e) => {
                      const next = e.target.value.trim();
                      if (next === "") {
                        setAmountPaid(0);
                        return;
                      }
                      if (!MONEY_PATTERN.test(next)) return;
                      const parsed = Number(next);
                      if (!Number.isNaN(parsed)) setAmountPaid(parsed);
                    }}
                  />
                </FormGroup>
              )}
              {(paymentMode === "credit" || paymentMode === "partial") && (
                <FormGroup>
                  <Label htmlFor="due_date">Due Date</Label>
                  <NepaliDateInput
                    id="due_date"
                    name="due_date"
                    value={dueDate || today}
                    onChange={setDueDate}
                  />
                </FormGroup>
              )}
            </div>
            {creditDue > 0 && (
              <p className="mt-3 text-sm font-medium text-warning">
                Credit (udhar): {formatCurrency(creditDue, currency)}
              </p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : compact ? "Complete sale" : "Complete POS"}</Button>
            {!compact && (
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            )}
          </div>
        </fieldset>
      </form>

      <div className="fixed inset-x-0 bottom-12 z-30 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">Grand Total</p>
            <p className="text-xl font-bold">{formatCurrency(total, currency)}</p>
          </div>
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!validate()) return;
              setConfirmOpen(true);
            }}
            className="px-6"
          >
            Save POS
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm POS sale"
        message={`Complete this sale for ${formatCurrency(total, currency)}${deliveryCharge > 0 ? ` (incl. ${formatCurrency(deliveryCharge, currency)} delivery)` : ""}${creditDue > 0 ? ` — ${formatCurrency(creditDue, currency)} on credit` : ""}?`}
        confirmLabel={compact ? "Complete sale" : "Complete POS"}
        onConfirm={confirmSale}
        onCancel={() => setConfirmOpen(false)}
        loading={pending}
      />
    </div>
  );
}
