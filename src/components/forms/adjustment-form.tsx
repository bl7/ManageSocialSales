"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordAdjustmentAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { VariantPicker } from "@/components/ui/variant-picker";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";
import { todayISODate } from "@/lib/date-ranges";

interface Variant {
  id: string;
  product_name: string;
  size: string;
  color: string;
  current_stock: number;
}

const REASONS = ["Damaged", "Lost", "Returned", "Wrong Count", "Giveaway", "Other"];

export function AdjustmentForm({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const today = todayISODate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [variantId, setVariantId] = useState("");
  const [quantityChange, setQuantityChange] = useState(0);

  const currentStock = variants.find((v) => v.id === variantId)?.current_stock ?? 0;
  const stockAfter = currentStock + quantityChange;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    if (!variantId) {
      setError("Please select a product variant.");
      setPending(false);
      return;
    }
    if (quantityChange === 0) {
      setError("Quantity change cannot be zero");
      setPending(false);
      return;
    }
    if (stockAfter < 0) {
      setError(`Correction would result in negative stock. Current: ${currentStock}`);
      setPending(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const result = await recordAdjustmentAction(null, formData);
    if (result?.success) {
      toast.success("Stock correction recorded");
      setPending(false);
      router.push("/ledger");
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader title="Stock Correction" description="Fix damaged, lost, returned, or miscounted stock" />

      <form onSubmit={handleSubmit} className="max-w-xl">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending} className="disabled:opacity-60">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <FormGroup>
              <Label htmlFor="adjustment_date">Date *</Label>
              <NepaliDateInput id="adjustment_date" name="adjustment_date" required defaultValue={today} />
            </FormGroup>
            <FormGroup>
              <Label>Product / Variant *</Label>
              <VariantPicker variants={variants} value={variantId} onChange={setVariantId} showStock />
              <input type="hidden" name="variant_id" value={variantId} required />
              {variantId && <p className="mt-2 text-sm font-medium">Current stock: {currentStock}</p>}
            </FormGroup>
            <FormGroup>
              <Label htmlFor="quantity_change">Quantity Change *</Label>
              <Input id="quantity_change" name="quantity_change" type="number" required
                value={quantityChange || ""}
                onChange={(e) => setQuantityChange(parseInt(e.target.value) || 0)}
                placeholder="Positive to add, negative to remove" />
              {variantId && quantityChange !== 0 && (
                <p className={`mt-2 text-sm font-medium ${stockAfter < 0 ? "text-danger" : "text-success"}`}>
                  Stock after correction: {stockAfter}
                </p>
              )}
            </FormGroup>
            <FormGroup>
              <Label htmlFor="reason">Reason *</Label>
              <Select id="reason" name="reason" required defaultValue="Wrong Count">
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </FormGroup>
          </div>
          <div className="mt-6 flex gap-3">
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Record Correction"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
