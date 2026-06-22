import { query, queryOne } from "@/lib/db";
import { T } from "@/lib/tables";
import { ACTIVE_SALE } from "@/lib/query-filters";
import {
  daysInRange,
  enrichVariantRow,
  type VariantPerformanceRow,
} from "@/lib/insights/calculations";
import {
  getOutstandingReceivables,
  getOutstandingPayables,
  getTotalReceivables,
  getTotalPayables,
} from "@/lib/queries/parties";

interface RawVariantRow {
  variant_id: string;
  product_id: string;
  product_name: string;
  category_id: string | null;
  category_name: string | null;
  size: string;
  color: string;
  units_sold: number;
  revenue: string;
  estimated_profit: string;
  current_stock: number;
  unit_cost: string;
  reorder_level: number;
  last_sold_date: string | null;
}

async function fetchVariantBaseRows(dateFrom: string, dateTo: string): Promise<RawVariantRow[]> {
  return query<RawVariantRow>(`
    WITH stock AS (
      SELECT variant_id, COALESCE(SUM(quantity_change), 0)::int AS current_stock
      FROM ${T.inventoryLedger}
      GROUP BY variant_id
    ),
    latest_cost AS (
      SELECT DISTINCT ON (variant_id)
        variant_id, unit_cost::numeric AS unit_cost
      FROM ${T.inventoryLedger}
      WHERE movement_type = 'purchase' AND unit_cost IS NOT NULL
      ORDER BY variant_id, created_at DESC
    ),
    last_sale AS (
      SELECT si.variant_id, MAX(s.sale_date)::text AS last_sold_date
      FROM ${T.saleItems} si
      JOIN ${T.sales} s ON s.id = si.sale_id
      WHERE ${ACTIVE_SALE.replace(/s\./g, "s.")}
      GROUP BY si.variant_id
    ),
    period_sales AS (
      SELECT
        si.variant_id,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        COALESCE(SUM(si.line_total), 0)::numeric AS revenue,
        COALESCE(SUM(
          si.line_total - si.quantity * COALESCE(lc.unit_cost, pv.default_cost_price)
        ), 0)::numeric AS estimated_profit
      FROM ${T.saleItems} si
      JOIN ${T.sales} s ON s.id = si.sale_id
      JOIN ${T.productVariants} pv ON pv.id = si.variant_id
      LEFT JOIN latest_cost lc ON lc.variant_id = si.variant_id
      WHERE ${ACTIVE_SALE}
        AND s.sale_date >= $1 AND s.sale_date <= $2
      GROUP BY si.variant_id
    )
    SELECT
      pv.id AS variant_id,
      p.id AS product_id,
      p.name AS product_name,
      p.category_id,
      pc.name AS category_name,
      pv.size,
      pv.color,
      COALESCE(ps.units_sold, 0)::int AS units_sold,
      COALESCE(ps.revenue, 0)::numeric AS revenue,
      COALESCE(ps.estimated_profit, 0)::numeric AS estimated_profit,
      COALESCE(st.current_stock, 0)::int AS current_stock,
      COALESCE(lc.unit_cost, pv.default_cost_price)::numeric AS unit_cost,
      pv.reorder_level::int AS reorder_level,
      ls.last_sold_date
    FROM ${T.productVariants} pv
    JOIN ${T.products} p ON p.id = pv.product_id
    LEFT JOIN ${T.productCategories} pc ON pc.id = p.category_id
    LEFT JOIN stock st ON st.variant_id = pv.id
    LEFT JOIN latest_cost lc ON lc.variant_id = pv.id
    LEFT JOIN last_sale ls ON ls.variant_id = pv.id
    LEFT JOIN period_sales ps ON ps.variant_id = pv.id
    WHERE pv.is_active = true AND p.is_active = true
    ORDER BY COALESCE(ps.estimated_profit, 0) DESC, p.name, pv.size, pv.color
  `, [dateFrom, dateTo]);
}

function buildPerformanceRows(
  raw: RawVariantRow[],
  dateFrom: string,
  dateTo: string
): VariantPerformanceRow[] {
  const periodDays = daysInRange(dateFrom, dateTo);
  const sold = raw.filter((r) => r.units_sold > 0).sort((a, b) => b.units_sold - a.units_sold);
  const hotSellerCutoff =
    sold.length > 0 ? sold[Math.max(0, Math.ceil(sold.length * 0.1) - 1)]?.units_sold ?? 1 : 999999;
  const velocities = sold.map((r) => r.units_sold / periodDays);
  const avgVelocity =
    velocities.length > 0 ? velocities.reduce((s, v) => s + v, 0) / velocities.length : 0;

  return raw.map((r) =>
    enrichVariantRow(
      {
        variant_id: r.variant_id,
        product_id: r.product_id,
        product_name: r.product_name,
        category_id: r.category_id,
        category_name: r.category_name,
        size: r.size,
        color: r.color,
        units_sold: Number(r.units_sold),
        revenue: Number(r.revenue),
        estimated_profit: Number(r.estimated_profit),
        current_stock: Number(r.current_stock),
        unit_cost: Number(r.unit_cost),
        reorder_level: Number(r.reorder_level),
        last_sold_date: r.last_sold_date,
      },
      periodDays,
      hotSellerCutoff,
      avgVelocity
    )
  );
}

export async function getVariantPerformance(
  dateFrom: string,
  dateTo: string
): Promise<VariantPerformanceRow[]> {
  const raw = await fetchVariantBaseRows(dateFrom, dateTo);
  return buildPerformanceRows(raw, dateFrom, dateTo);
}

export async function getProductVariantPerformance(
  productId: string,
  dateFrom: string,
  dateTo: string
): Promise<VariantPerformanceRow[]> {
  const rows = await getVariantPerformance(dateFrom, dateTo);
  return rows.filter((r) => r.product_id === productId);
}

export interface InsightCardData {
  id: string;
  tone: "green" | "amber" | "red" | "gray";
  headline: string;
  metric: string;
  explanation: string;
  action: string;
  href: string;
}

export async function getTopInsightCards(
  dateFrom: string,
  dateTo: string,
  currency: string
): Promise<InsightCardData[]> {
  const rows = await getVariantPerformance(dateFrom, dateTo);
  const cards: InsightCardData[] = [];

  const fastest = [...rows]
    .filter((r) => r.units_sold > 0)
    .sort((a, b) => b.sales_velocity - a.sales_velocity)[0];
  if (fastest) {
    cards.push({
      id: "fastest",
      tone: "green",
      headline: `${fastest.product_name} / ${fastest.size} is your fastest seller`,
      metric: `${fastest.units_sold} sold`,
      explanation: `Current stock: ${fastest.current_stock} units. Velocity: ${fastest.sales_velocity.toFixed(1)} units/day.`,
      action: fastest.current_stock <= fastest.reorder_level ? "Restock soon" : "Keep promoting",
      href: "/purchases/new",
    });
  }

  const topProfit = [...rows].sort((a, b) => b.estimated_profit - a.estimated_profit)[0];
  if (topProfit && topProfit.estimated_profit > 0) {
    cards.push({
      id: "profit",
      tone: "green",
      headline: `${topProfit.product_name} generated the highest gross profit`,
      metric: `${currency} ${topProfit.estimated_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      explanation: `Margin: ${topProfit.estimated_margin.toFixed(0)}% · ${topProfit.units_sold} units sold in period.`,
      action: "Promote this product more",
      href: `/products/${topProfit.product_id}`,
    });
  }

  const dead = rows
    .filter((r) => r.performance_status === "dead_stock")
    .sort((a, b) => b.stock_value - a.stock_value)[0];
  if (dead) {
    cards.push({
      id: "dead",
      tone: "amber",
      headline: `${dead.product_name} / ${dead.size} is not moving`,
      metric: dead.days_since_last_sale !== null ? `${dead.days_since_last_sale} days since last sale` : "No recent sales",
      explanation: `Stock value tied up: ${currency} ${dead.stock_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`,
      action: "Consider discounting",
      href: "/insights?filter=dead_stock",
    });
  }

  const stockout = rows
    .filter((r) => r.days_until_stockout !== null && r.days_until_stockout <= 14 && r.sales_velocity > 0)
    .sort((a, b) => (a.days_until_stockout ?? 999) - (b.days_until_stockout ?? 999))[0];
  if (stockout) {
    cards.push({
      id: "stockout",
      tone: "red",
      headline: `${stockout.product_name} / ${stockout.size} may run out soon`,
      metric: stockout.days_until_stockout !== null ? `${stockout.days_until_stockout} days left` : "Low stock",
      explanation: `Sold ${stockout.units_sold} in period (${stockout.sales_velocity.toFixed(1)}/day). Stock: ${stockout.current_stock}.`,
      action: "Plan reorder",
      href: "/purchases/new",
    });
  }

  const receivables = await getTotalReceivables();
  if (receivables > 0) {
    const top = (await getOutstandingReceivables())[0];
    cards.push({
      id: "credit",
      tone: receivables > 50000 ? "red" : "amber",
      headline: `${currency} ${receivables.toLocaleString(undefined, { maximumFractionDigits: 0 })} owed by customers`,
      metric: top ? `Top: ${top.name}` : "Follow up",
      explanation: top
        ? `${top.name} owes ${currency} ${top.current_balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`
        : "Collect outstanding customer credit.",
      action: "Follow up on credit",
      href: "/parties?tab=to-collect",
    });
  }

  const slowValue = rows
    .filter((r) => r.performance_status === "dead_stock" || r.performance_status === "slow_moving")
    .reduce((s, r) => s + r.stock_value, 0);
  if (slowValue > 0) {
    cards.push({
      id: "cash",
      tone: "amber",
      headline: `${currency} ${slowValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} tied in slow-moving stock`,
      metric: `${rows.filter((r) => r.performance_status === "dead_stock" || r.performance_status === "slow_moving").length} variants`,
      explanation: "Cash is sitting in inventory that is not selling quickly.",
      action: "Clear old stock before buying more",
      href: "/insights?section=clearance",
    });
  }

  return cards.slice(0, 6);
}

export interface DashboardInsightAlert {
  id: string;
  message: string;
  href: string;
  tone: "amber" | "red" | "green";
}

export async function getDashboardInsightAlerts(): Promise<DashboardInsightAlert[]> {
  const month = await import("@/lib/date-ranges").then((m) => m.getDateRange("month", "BS"));
  if (!month) return [];
  const rows = await getVariantPerformance(month.from, month.to);
  const alerts: DashboardInsightAlert[] = [];

  const stockoutRisk = rows.filter(
    (r) =>
      r.days_until_stockout !== null &&
      r.days_until_stockout <= 14 &&
      r.sales_velocity > 0 &&
      r.current_stock > 0
  ).length;
  if (stockoutRisk > 0) {
    alerts.push({
      id: "stockout",
      message: `${stockoutRisk} product${stockoutRisk === 1 ? "" : "s"} may run out soon`,
      href: "/insights?section=restock",
      tone: "amber",
    });
  }

  const receivables = await getTotalReceivables();
  if (receivables > 0) {
    alerts.push({
      id: "credit",
      message: `Rs. ${receivables.toLocaleString(undefined, { maximumFractionDigits: 0 })} pending customer credit`,
      href: "/insights?section=credit",
      tone: receivables > 50000 ? "red" : "amber",
    });
  }

  const deadCount = rows.filter((r) => r.performance_status === "dead_stock").length;
  if (deadCount > 0) {
    alerts.push({
      id: "dead",
      message: `${deadCount} product${deadCount === 1 ? "" : "s"} have not sold in 60+ days`,
      href: "/insights?filter=dead_stock",
      tone: "amber",
    });
  }

  return alerts.slice(0, 3);
}

export interface CreditInsightsData {
  owedToYou: number;
  youOwe: number;
  netPosition: number;
  topReceivables: { id: string; name: string; balance: number }[];
  topPayables: { id: string; name: string; balance: number }[];
  overdueAmount: number;
  overdueCount: number;
}

export async function getCreditInsights(): Promise<CreditInsightsData> {
  const [owedToYou, youOwe, receivables, payables, overdue] = await Promise.all([
    getTotalReceivables(),
    getTotalPayables(),
    getOutstandingReceivables(),
    getOutstandingPayables(),
    queryOne<{ amount: string; count: string }>(`
      SELECT
        COALESCE(SUM(s.total_amount - COALESCE(s.amount_paid, 0)), 0)::numeric AS amount,
        COUNT(*)::int AS count
      FROM ${T.sales} s
      WHERE ${ACTIVE_SALE}
        AND s.due_date IS NOT NULL
        AND s.due_date < CURRENT_DATE
        AND COALESCE(s.amount_paid, 0) < s.total_amount
    `),
  ]);

  return {
    owedToYou,
    youOwe,
    netPosition: owedToYou - youOwe,
    topReceivables: receivables.slice(0, 5).map((r) => ({
      id: r.id,
      name: r.name,
      balance: r.current_balance,
    })),
    topPayables: payables.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      balance: p.current_balance,
    })),
    overdueAmount: Number(overdue?.amount ?? 0),
    overdueCount: Number(overdue?.count ?? 0),
  };
}

export async function getSlowMovingStockValue(): Promise<number> {
  const month = await import("@/lib/date-ranges").then((m) => m.getDateRange("90days", "BS"));
  if (!month) return 0;
  const rows = await getVariantPerformance(month.from, month.to);
  return rows
    .filter((r) => r.performance_status === "dead_stock" || r.performance_status === "slow_moving")
    .reduce((s, r) => s + r.stock_value, 0);
}

export async function getInsightFilterOptions() {
  const [categories, sizes, colors] = await Promise.all([
    query<{ id: string; name: string }>(
      `SELECT id, name FROM ${T.productCategories} WHERE is_active = true ORDER BY name`
    ),
    query<{ size: string }>(
      `SELECT DISTINCT size FROM ${T.productVariants} WHERE is_active = true ORDER BY size`
    ),
    query<{ color: string }>(
      `SELECT DISTINCT color FROM ${T.productVariants} WHERE is_active = true ORDER BY color`
    ),
  ]);
  return { categories, sizes: sizes.map((s) => s.size), colors: colors.map((c) => c.color) };
}

export async function hasSalesData(): Promise<boolean> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM ${T.sales} s WHERE ${ACTIVE_SALE}`
  );
  return Number(row?.count ?? 0) > 0;
}

export async function hasPurchaseCostData(): Promise<boolean> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM ${T.inventoryLedger}
     WHERE movement_type = 'purchase' AND unit_cost IS NOT NULL`
  );
  return Number(row?.count ?? 0) > 0;
}

export interface ProductInsightSummary {
  unitsSold: number;
  revenue: number;
  profit: number;
  stockValue: number;
  bestVariant: VariantPerformanceRow | null;
  slowestVariant: VariantPerformanceRow | null;
  recommendation: string;
  lastSoldDate: string | null;
}

export async function getProductInsightSummary(
  productId: string,
  dateFrom: string,
  dateTo: string
): Promise<ProductInsightSummary> {
  const variants = await getProductVariantPerformance(productId, dateFrom, dateTo);
  const unitsSold = variants.reduce((s, v) => s + v.units_sold, 0);
  const revenue = variants.reduce((s, v) => s + v.revenue, 0);
  const profit = variants.reduce((s, v) => s + v.estimated_profit, 0);
  const stockValue = variants.reduce((s, v) => s + v.stock_value, 0);

  const sold = variants.filter((v) => v.units_sold > 0);
  const bestVariant =
    sold.length > 0 ? [...sold].sort((a, b) => b.units_sold - a.units_sold)[0] : null;
  const slowestVariant =
    variants
      .filter((v) => v.current_stock > 0)
      .sort((a, b) => (b.days_since_last_sale ?? 9999) - (a.days_since_last_sale ?? 9999))[0] ?? null;

  const lastSoldDate = variants
    .map((v) => v.last_sold_date)
    .filter(Boolean)
    .sort()
    .reverse()[0] ?? null;

  let recommendation = "Record sales to unlock variant-level recommendations.";
  if (bestVariant) {
    if (bestVariant.performance_status === "low_stock" || bestVariant.performance_status === "hot_seller") {
      recommendation = `${bestVariant.color} / ${bestVariant.size} is selling fastest. Consider restocking ${bestVariant.product_name} ${bestVariant.color} / ${bestVariant.size} first.`;
    } else if (slowestVariant?.performance_status === "dead_stock") {
      recommendation = `${slowestVariant.color} / ${slowestVariant.size} is not moving. Consider a discount or story promotion before restocking.`;
    } else {
      recommendation = `${bestVariant.color} / ${bestVariant.size} leads sales this period. Keep it visible on Instagram.`;
    }
  }

  return {
    unitsSold,
    revenue,
    profit,
    stockValue,
    bestVariant,
    slowestVariant,
    recommendation,
    lastSoldDate,
  };
}
