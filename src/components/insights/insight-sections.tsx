import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { VariantPerformanceRow } from "@/lib/insights/calculations";

export function RestockSuggestions({
  rows,
  currency,
}: {
  rows: VariantPerformanceRow[];
  currency: string;
}) {
  const items = rows
    .filter(
      (r) =>
        r.performance_status === "hot_seller" ||
        r.performance_status === "low_stock" ||
        r.performance_status === "out_of_stock" ||
        (r.days_until_stockout !== null && r.days_until_stockout <= 21)
    )
    .sort((a, b) => (a.days_until_stockout ?? 999) - (b.days_until_stockout ?? 999))
    .slice(0, 12);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
        No urgent restock suggestions right now. Your fast sellers have healthy stock levels.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r) => (
        <div key={r.variant_id} className="rounded-2xl border border-amber-200 bg-card p-4">
          <p className="font-semibold">{r.product_name}</p>
          <p className="text-sm text-muted">{r.color} / {r.size}</p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Stock</dt><dd>{r.current_stock}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Sold (period)</dt><dd>{r.units_sold}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Velocity</dt><dd>{r.sales_velocity > 0 ? `${r.sales_velocity.toFixed(1)}/day` : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Stockout in</dt><dd>{r.days_until_stockout !== null ? `${r.days_until_stockout} days` : "—"}</dd></div>
            <div className="flex justify-between font-medium text-primary"><dt>Suggested reorder</dt><dd>{r.suggested_reorder} units</dd></div>
          </dl>
          <Link href="/purchases/new" className="mt-4 inline-block">
            <Button variant="outline" size="sm">Record Purchase</Button>
          </Link>
        </div>
      ))}
    </div>
  );
}

export function ClearanceSuggestions({
  rows,
  currency,
}: {
  rows: VariantPerformanceRow[];
  currency: string;
}) {
  const items = rows
    .filter((r) => r.performance_status === "dead_stock" || r.performance_status === "slow_moving")
    .sort((a, b) => b.stock_value - a.stock_value)
    .slice(0, 12);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
        No clearance suggestions. Inventory is moving at a healthy pace.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r) => (
        <div key={r.variant_id} className="rounded-2xl border border-border bg-card p-4">
          <p className="font-semibold">{r.product_name}</p>
          <p className="text-sm text-muted">{r.color} / {r.size}</p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Stock</dt><dd>{r.current_stock}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Stock value</dt><dd>{formatCurrency(r.stock_value, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Last sold</dt><dd>{r.days_since_last_sale !== null ? `${r.days_since_last_sale}d ago` : "Never"}</dd></div>
            <div className="flex justify-between font-medium text-amber-700"><dt>Suggestion</dt><dd>{r.clearance_action}</dd></div>
          </dl>
        </div>
      ))}
    </div>
  );
}
