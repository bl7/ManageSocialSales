"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PerformanceBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { PERFORMANCE_LABELS, type PerformanceStatus, type VariantPerformanceRow } from "@/lib/insights/calculations";

type SortKey =
  | "estimated_profit"
  | "units_sold"
  | "revenue"
  | "current_stock"
  | "days_since_last_sale"
  | "sales_velocity"
  | "stock_value";

interface Props {
  rows: VariantPerformanceRow[];
  currency: string;
  categories: { id: string; name: string }[];
  sizes: string[];
  colors: string[];
  initialFilter?: string;
}

export function ProductPerformanceTable({
  rows,
  currency,
  categories,
  sizes,
  colors,
  initialFilter,
}: Props) {
  const [sort, setSort] = useState<SortKey>("estimated_profit");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [status, setStatus] = useState(initialFilter || "");

  const filtered = useMemo(() => {
    let list = [...rows];
    if (category) list = list.filter((r) => r.category_id === category);
    if (size) list = list.filter((r) => r.size === size);
    if (color) list = list.filter((r) => r.color === color);
    if (status) list = list.filter((r) => r.performance_status === status);
    list.sort((a, b) => {
      const av = a[sort] ?? 0;
      const bv = b[sort] ?? 0;
      if (sort === "days_since_last_sale") {
        return (b.days_since_last_sale ?? -1) - (a.days_since_last_sale ?? -1);
      }
      return Number(bv) - Number(av);
    });
    return list;
  }, [rows, category, size, color, status, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-auto min-w-[120px]">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select value={size} onChange={(e) => setSize(e.target.value)} className="h-9 w-auto min-w-[100px]">
          <option value="">All sizes</option>
          {sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-auto min-w-[100px]">
          <option value="">All colors</option>
          {colors.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-auto min-w-[140px]">
          <option value="">All statuses</option>
          {(Object.keys(PERFORMANCE_LABELS) as PerformanceStatus[]).map((k) => (
            <option key={k} value={k}>{PERFORMANCE_LABELS[k]}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-9 w-auto min-w-[140px]">
          <option value="estimated_profit">Gross profit</option>
          <option value="units_sold">Units sold</option>
          <option value="revenue">Revenue</option>
          <option value="current_stock">Current stock</option>
          <option value="days_since_last_sale">Days since sale</option>
          <option value="sales_velocity">Sales velocity</option>
          <option value="stock_value">Stock value</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
          No variants match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Profit</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Velocity</th>
                <th className="px-4 py-3">Stockout</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.variant_id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <Link href={`/products/${r.product_id}`} className="font-medium text-primary hover:underline">
                      {r.product_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.color} / {r.size}</td>
                  <td className="px-4 py-3">{r.units_sold}</td>
                  <td className="px-4 py-3">{formatCurrency(r.revenue, currency)}</td>
                  <td className="px-4 py-3">{formatCurrency(r.estimated_profit, currency)}</td>
                  <td className="px-4 py-3">{r.current_stock}</td>
                  <td className="px-4 py-3">
                    {r.sales_velocity > 0 ? `${r.sales_velocity.toFixed(2)}/day` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.days_until_stockout !== null ? `${r.days_until_stockout}d` : r.sales_velocity > 0 ? "—" : "No recent sales"}
                  </td>
                  <td className="px-4 py-3">
                    <PerformanceBadge status={r.performance_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
