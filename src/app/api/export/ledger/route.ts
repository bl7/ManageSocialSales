import { requireApiAuth } from "@/lib/api-auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { getLedgerEntries } from "@/lib/queries/ledger";
import { getSettings } from "@/lib/queries/dashboard";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export async function GET(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const filters = {
    productId: searchParams.get("productId") || undefined,
    size: searchParams.get("size") || undefined,
    color: searchParams.get("color") || undefined,
    movementType: searchParams.get("movementType") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
  };

  const [entries, settings] = await Promise.all([
    getLedgerEntries(filters, 5000),
    getSettings(),
  ]);
  const currency = settings?.currency ?? "Rs.";

  const csv = toCsv(
    ["Date", "Product", "Size", "Color", "Type", "Change", "Stock After", "Unit Cost", "Sale Price", "Notes"],
    entries.map((e) => [
      formatDateTime(e.created_at),
      e.product_name,
      e.size,
      e.color,
      e.movement_type,
      e.quantity_change,
      e.stock_after,
      e.unit_cost ? formatCurrency(e.unit_cost, currency) : "",
      e.unit_sale_price ? formatCurrency(e.unit_sale_price, currency) : "",
      e.notes ?? "",
    ])
  );

  return csvResponse(`stock-ledger-${new Date().toISOString().split("T")[0]}.csv`, csv);
}
