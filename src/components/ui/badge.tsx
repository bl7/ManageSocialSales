import { cn } from "@/lib/utils";
import type { StockStatus } from "@/types";

const styles: Record<StockStatus, string> = {
  in_stock: "bg-green-100 text-green-800",
  low_stock: "bg-amber-100 text-amber-800",
  out_of_stock: "bg-red-100 text-red-800",
};

const labels: Record<StockStatus, string> = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
};

export function StockBadge({ status }: { status: StockStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}

export function MovementBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    purchase: "bg-emerald-100 text-emerald-800",
    sale: "bg-rose-100 text-rose-800",
    adjustment: "bg-amber-100 text-amber-800",
    sale_void: "bg-slate-200 text-slate-700",
    purchase_void: "bg-slate-200 text-slate-700",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", colors[type] || "bg-slate-100")}>
      {type.replace(/_/g, " ")}
    </span>
  );
}
