import { requireApiAuth } from "@/lib/api-auth";
import { toCsv, csvResponse } from "@/lib/csv";
import {
  getBestSellingProducts,
  getLowStockReport,
  getOutOfStockReport,
} from "@/lib/queries/reports";
import { getSettings } from "@/lib/queries/dashboard";
import { formatCurrency } from "@/lib/utils";

export async function GET(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;

  const [bestSelling, lowStock, outOfStock, settings] = await Promise.all([
    getBestSellingProducts(dateFrom, dateTo),
    getLowStockReport(),
    getOutOfStockReport(),
    getSettings(),
  ]);
  const currency = settings?.currency ?? "Rs.";

  const rows: (string | number)[][] = [
    ["=== BEST SELLING ===", "", "", "", ""],
    ...bestSelling.map((r) => [
      r.product_name, r.size, r.color, r.total_sold,
      formatCurrency(r.total_revenue, currency),
    ]),
    ["", "", "", "", ""],
    ["=== LOW STOCK ===", "", "", ""],
    ...lowStock.map((r) => [
      r.product_name, r.size, r.color, r.current_stock, r.reorder_level,
    ]),
    ["", "", "", ""],
    ["=== OUT OF STOCK ===", "", ""],
    ...outOfStock.map((r) => [
      r.product_name, r.size, r.color, r.current_stock,
    ]),
  ];

  const csv = toCsv(["Col1", "Col2", "Col3", "Col4", "Col5"], rows);
  return csvResponse(`reports-${new Date().toISOString().split("T")[0]}.csv`, csv);
}
