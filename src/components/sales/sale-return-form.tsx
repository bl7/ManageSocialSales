"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordSaleReturnAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AccountSelect } from "@/components/ui/account-select";
import { FormGroup, Label, ErrorMessage } from "@/components/ui/page";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";
import { formatCurrency } from "@/lib/utils";
import { todayISODate } from "@/lib/date-ranges";

interface SaleItem {
  id: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  returned_quantity: number;
  unit_sale_price: string;
}

interface Props {
  saleId: string;
  items: SaleItem[];
  accounts: { id: string; name: string }[];
  currency: string;
  amountPaid: number;
}

export function SaleReturnForm({ saleId, items, accounts, currency, amountPaid }: Props) {
  const router = useRouter();
  const today = todayISODate();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});

  const returnableItems = useMemo(
    () => items.filter((i) => i.quantity - i.returned_quantity > 0),
    [items]
  );

  const refundTotal = returnableItems.reduce((sum, item) => {
    const q = qty[item.id] || 0;
    return sum + q * Number(item.unit_sale_price);
  }, 0);

  if (returnableItems.length === 0) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const returnItems = returnableItems
      .map((item) => ({ sale_item_id: item.id, quantity: qty[item.id] || 0 }))
      .filter((i) => i.quantity > 0);

    if (returnItems.length === 0) {
      setError("Enter quantity for at least one item.");
      return;
    }

    if (refundTotal > 0 && amountPaid > 0 && !accounts.length) {
      setError("No account available for cash refund.");
      return;
    }

    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("sale_id", saleId);
    formData.set("items", JSON.stringify(returnItems));

    const result = await recordSaleReturnAction(null, formData);
    if (result?.success) {
      toast.success("Return recorded");
      setOpen(false);
      setQty({});
      router.refresh();
      setPending(false);
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Return Items
      </Button>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Return Items</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorMessage message={error} />}

        <div className="space-y-3">
          {returnableItems.map((item) => {
            const max = item.quantity - item.returned_quantity;
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-xs text-muted">
                    {item.color} / {item.size} · sold {item.quantity}
                    {item.returned_quantity > 0 ? ` · returned ${item.returned_quantity}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`qty-${item.id}`}>Return qty</Label>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min={0}
                    max={max}
                    value={qty[item.id] || ""}
                    placeholder="0"
                    className="w-20"
                    onChange={(e) =>
                      setQty((prev) => ({
                        ...prev,
                        [item.id]: Math.min(max, Math.max(0, parseInt(e.target.value) || 0)),
                      }))
                    }
                  />
                  <span className="text-xs text-muted">/ {max}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormGroup>
            <Label htmlFor="return_date">Return date *</Label>
            <NepaliDateInput id="return_date" name="return_date" required defaultValue={today} />
          </FormGroup>
          {amountPaid > 0 && (
            <AccountSelect accounts={accounts} label="Refund from account" />
          )}
        </div>

        <FormGroup>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" />
        </FormGroup>

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Refund total: {formatCurrency(refundTotal, currency)}
          </p>
          <Button type="submit" disabled={pending || refundTotal <= 0}>
            {pending ? "Saving…" : "Record Return"}
          </Button>
        </div>
      </form>
    </div>
  );
}
