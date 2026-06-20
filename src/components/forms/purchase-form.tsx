"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordPurchaseAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VariantPicker } from "@/components/ui/variant-picker";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";

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

export function PurchaseForm({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<LineItem[]>([{ variant_id: "", quantity: 1, unit_cost: 0 }]);

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0);

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

    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(items));

    const result = await recordPurchaseAction(null, formData);
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

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label htmlFor="purchase_date">Purchase Date *</Label>
              <Input id="purchase_date" name="purchase_date" type="date" required defaultValue={today} />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" name="supplier" />
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
                <span className="text-sm text-muted">Line total: ${(item.quantity * item.unit_cost).toFixed(2)}</span>
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>Remove</Button>
                )}
              </div>
            </div>
          ))}

          <div className="mt-4 text-right text-lg font-bold">Total: ${total.toFixed(2)}</div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Record Purchase"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
