export type PerformanceStatus =
  | "hot_seller"
  | "profitable"
  | "slow_moving"
  | "dead_stock"
  | "low_stock"
  | "out_of_stock"
  | "neutral";

export const PERFORMANCE_LABELS: Record<PerformanceStatus, string> = {
  hot_seller: "Hot Seller",
  profitable: "Profitable",
  slow_moving: "Slow Moving",
  dead_stock: "Not Moving",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
  neutral: "Steady",
};

export function daysInRange(from: string, to: string): number {
  const f = new Date(`${from}T00:00:00`);
  const t = new Date(`${to}T00:00:00`);
  return Math.max(1, Math.round((t.getTime() - f.getTime()) / 86400000) + 1);
}

export function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - d.getTime()) / 86400000));
}

export function salesVelocity(unitsSold: number, periodDays: number): number {
  if (periodDays <= 0) return 0;
  return unitsSold / periodDays;
}

export function daysUntilStockout(stock: number, velocity: number): number | null {
  if (velocity <= 0 || stock <= 0) return null;
  return Math.floor(stock / velocity);
}

export function estimatedMargin(revenue: number, profit: number): number {
  if (revenue <= 0) return 0;
  return (profit / revenue) * 100;
}

export function suggestedReorderQty(unitsSold: number, reorderLevel: number): number {
  return Math.max(Math.round(reorderLevel * 2), Math.round(unitsSold), 1);
}

export function isDeadStock(
  stock: number,
  daysSinceLastSale: number | null,
  unitsSoldInPeriod: number
): boolean {
  if (stock <= 0) return false;
  if (daysSinceLastSale !== null && daysSinceLastSale >= 60) return true;
  return unitsSoldInPeriod === 0;
}

export function isSlowMoving(
  stock: number,
  unitsSold: number,
  daysSinceLastSale: number | null,
  periodDays: number,
  dead: boolean
): boolean {
  if (dead || stock <= 0) return false;
  const threshold = periodDays >= 30 ? 2 : Math.max(1, Math.floor(periodDays / 15));
  return unitsSold <= threshold && (daysSinceLastSale === null || daysSinceLastSale >= 14);
}

export function derivePerformanceStatus(input: {
  stock: number;
  reorderLevel: number;
  unitsSold: number;
  profit: number;
  velocity: number;
  avgVelocity: number;
  hotSellerCutoff: number;
  daysSinceLastSale: number | null;
  periodDays: number;
}): PerformanceStatus {
  const {
    stock,
    reorderLevel,
    unitsSold,
    profit,
    velocity,
    avgVelocity,
    hotSellerCutoff,
    daysSinceLastSale,
    periodDays,
  } = input;

  if (stock <= 0) return "out_of_stock";
  if (isDeadStock(stock, daysSinceLastSale, unitsSold)) return "dead_stock";
  if (stock > 0 && stock <= reorderLevel) return "low_stock";
  if (
    unitsSold > 0 &&
    (unitsSold >= hotSellerCutoff || (avgVelocity > 0 && velocity >= avgVelocity * 1.25))
  ) {
    return "hot_seller";
  }
  if (isSlowMoving(stock, unitsSold, daysSinceLastSale, periodDays, false)) {
    return "slow_moving";
  }
  if (profit > 0 && unitsSold > 0) return "profitable";
  return "neutral";
}

export interface VariantPerformanceRow {
  variant_id: string;
  product_id: string;
  product_name: string;
  category_id: string | null;
  category_name: string | null;
  size: string;
  color: string;
  units_sold: number;
  revenue: number;
  estimated_profit: number;
  current_stock: number;
  unit_cost: number;
  stock_value: number;
  reorder_level: number;
  avg_sale_price: number;
  last_sold_date: string | null;
  days_since_last_sale: number | null;
  sales_velocity: number;
  days_until_stockout: number | null;
  estimated_margin: number;
  performance_status: PerformanceStatus;
  suggested_reorder: number;
  clearance_action: string | null;
}

export function enrichVariantRow(
  raw: {
    variant_id: string;
    product_id: string;
    product_name: string;
    category_id: string | null;
    category_name: string | null;
    size: string;
    color: string;
    units_sold: number;
    revenue: number;
    estimated_profit: number;
    current_stock: number;
    unit_cost: number;
    reorder_level: number;
    last_sold_date: string | null;
  },
  periodDays: number,
  hotSellerCutoff: number,
  avgVelocity: number
): VariantPerformanceRow {
  const stock_value = raw.current_stock * raw.unit_cost;
  const velocity = salesVelocity(raw.units_sold, periodDays);
  const days_since_last_sale = daysSince(raw.last_sold_date);
  const dead = isDeadStock(raw.current_stock, days_since_last_sale, raw.units_sold);
  const performance_status = derivePerformanceStatus({
    stock: raw.current_stock,
    reorderLevel: raw.reorder_level,
    unitsSold: raw.units_sold,
    profit: raw.estimated_profit,
    velocity,
    avgVelocity,
    hotSellerCutoff,
    daysSinceLastSale: days_since_last_sale,
    periodDays,
  });

  let clearance_action: string | null = null;
  if (dead && stock_value > 10000) clearance_action = "Bundle with best seller";
  else if (performance_status === "dead_stock") clearance_action = "Discount";
  else if (performance_status === "slow_moving") clearance_action = "Promote on Instagram story";
  if (dead && stock_value > 5000 && !clearance_action) clearance_action = "Stop restocking";

  return {
    ...raw,
    stock_value,
    avg_sale_price: raw.units_sold > 0 ? raw.revenue / raw.units_sold : 0,
    days_since_last_sale,
    sales_velocity: velocity,
    days_until_stockout: daysUntilStockout(raw.current_stock, velocity),
    estimated_margin: estimatedMargin(raw.revenue, raw.estimated_profit),
    performance_status,
    suggested_reorder: suggestedReorderQty(raw.units_sold, raw.reorder_level),
    clearance_action:
      performance_status === "dead_stock" || performance_status === "slow_moving"
        ? clearance_action
        : null,
  };
}
