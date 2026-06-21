"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NepaliDateInput } from "@/components/ui/nepali-date-input";
import { todayISODate } from "@/lib/date-ranges";

interface Props {
  products: { id: string; name: string }[];
  productId?: string;
  size?: string;
  color?: string;
  movementType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function LedgerFilters({
  products,
  productId,
  size,
  color,
  movementType,
  dateFrom,
  dateTo,
}: Props) {
  const router = useRouter();
  const today = todayISODate();
  const isToday = dateFrom === today && dateTo === today;

  function goToday() {
    const params = new URLSearchParams();
    params.set("dateFrom", today);
    params.set("dateTo", today);
    if (productId) params.set("productId", productId);
    if (movementType) params.set("movementType", movementType);
    router.push(`/ledger?${params.toString()}`);
  }

  return (
    <form action="/ledger" method="get" className="mb-6 space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={isToday ? "default" : "outline"} size="sm" onClick={goToday}>
          Today
        </Button>
        <Link href="/ledger">
          <Button type="button" variant="outline" size="sm">Clear filters</Button>
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select name="productId" defaultValue={productId || ""}
          className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input name="size" placeholder="Size" defaultValue={size}
          className="h-10 rounded-lg border border-border px-3 text-sm" />
        <input name="color" placeholder="Color" defaultValue={color}
          className="h-10 rounded-lg border border-border px-3 text-sm" />
        <select name="movementType" defaultValue={movementType || ""}
          className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="sale">Sale</option>
          <option value="adjustment">Stock Correction</option>
          <option value="sale_void">Sale Void</option>
          <option value="purchase_void">Purchase Void</option>
        </select>
        <NepaliDateInput name="dateFrom" defaultValue={dateFrom} allowEmpty={!dateFrom} />
        <NepaliDateInput name="dateTo" defaultValue={dateTo} allowEmpty={!dateTo} />
        <Button type="submit" className="sm:col-span-2 lg:col-span-3">Apply Filters</Button>
      </div>
    </form>
  );
}
