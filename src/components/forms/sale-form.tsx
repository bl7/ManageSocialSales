"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordSaleAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
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
  unit_sale_price: number;
}

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "WhatsApp", "Walk-in", "Other"];

export function SaleForm({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<LineItem[]>([{ variant_id: "", quantity: 1, unit_sale_price: 0 }]);

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_sale_price, 0);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    for (const item of items) {
      const stock = getStock(item.variant_id);
      if (item.quantity > stock) {
        setError(`Cannot sell ${item.quantity} units. Only ${stock} available.`);
        setPending(false);
        return;
      }
    }

    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(items));

    const result = await recordSaleAction(null, formData);
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader title="Record Sale" description="Record a sale from Instagram, WhatsApp, or other channels" />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label htmlFor="sale_date">Sale Date *</Label>
              <Input id="sale_date" name="sale_date" type="date" required defaultValue={today} />
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
                  <Input type="number" min="0" step="0.01" required value={item.unit_sale_price}
                    onChange={(e) => updateItem(i, "unit_sale_price", parseFloat(e.target.value) || 0)} />
                </FormGroup>
                <div className="flex items-end justify-between sm:col-span-4">
                  <span className="text-sm text-muted">Line total: ${(item.quantity * item.unit_sale_price).toFixed(2)}</span>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>Remove</Button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="mt-4 text-right text-lg font-bold">Total: ${total.toFixed(2)}</div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Record Sale"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
