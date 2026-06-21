import { requireApiAuth } from "@/lib/api-auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { getProductsWithVariants } from "@/lib/queries/products";
import { getSettings } from "@/lib/queries/dashboard";
import { formatCurrency } from "@/lib/utils";

export async function GET() {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const [products, settings] = await Promise.all([
    getProductsWithVariants(),
    getSettings(),
  ]);
  const currency = settings?.currency ?? "Rs.";

  const csv = toCsv(
    ["Product", "SKU", "Category", "Size", "Color", "Cost", "Price", "Stock", "Purchased", "Sold", "Status"],
    products.map((p) => [
      p.product_name,
      p.sku ?? "",
      p.category ?? "",
      p.size,
      p.color,
      formatCurrency(p.default_cost_price, currency),
      formatCurrency(p.default_selling_price, currency),
      p.current_stock,
      p.purchased_qty,
      p.sold_qty,
      p.stock_status.replace("_", " "),
    ])
  );

  return csvResponse(`products-${new Date().toISOString().split("T")[0]}.csv`, csv);
}
