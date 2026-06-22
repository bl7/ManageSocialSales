import Link from "next/link";
import { getLedgerEntries } from "@/lib/queries/ledger";
import { query } from "@/lib/db";
import { T } from "@/lib/tables";
import { getSettings } from "@/lib/queries/dashboard";
import { resolveLedgerDateRange } from "@/lib/date-ranges";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { MovementBadge } from "@/components/ui/badge";
import { ExportButton } from "@/components/export/export-button";
import { LedgerFilters } from "@/components/ledger/ledger-filters";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { getDateFormatters, getDateCalendar } from "@/lib/date-preference.server";

interface Props {
  searchParams: Promise<{
    productId?: string;
    size?: string;
    color?: string;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
    preset?: string;
  }>;
}

export default async function LedgerPage({ searchParams }: Props) {
  const params = await searchParams;
  const calendar = await getDateCalendar();
  const { formatDateTime } = await getDateFormatters();
  const { from: dateFrom, to: dateTo } = resolveLedgerDateRange(params, calendar);
  const filters = { ...params, dateFrom, dateTo };
  const [entries, products, settings] = await Promise.all([
    getLedgerEntries(filters),
    query<{ id: string; name: string }>(`SELECT id, name FROM ${T.products} WHERE is_active = true ORDER BY name`),
    getSettings(),
  ]);
  const currency = settings?.currency ?? "Rs.";

  return (
    <div>
      <PageHeader title="Stock History" description="Complete stock movement history — why stock is what it is">
        <Link href="/stock-corrections/new"><Button>Stock Correction</Button></Link>
        <ExportButton href={`/api/export/ledger?${new URLSearchParams(params as Record<string, string>).toString()}`} />
      </PageHeader>

      <LedgerFilters
        products={products}
        productId={params.productId}
        size={params.size}
        color={params.color}
        movementType={params.movementType}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      {entries.length === 0 ? (
        <EmptyState
          message="No stock movements match your filters."
          actionLabel="Open POS"
          actionHref="/pos/new"
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-3">Date/Time</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">Stock After</th>
              <th className="px-4 py-3">Unit Cost</th>
              <th className="px-4 py-3">Sale Price</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className={`hover:bg-slate-50 ${["sale_void", "purchase_void"].includes(e.movement_type) ? "bg-red-50/30" : ""}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(e.created_at)}</td>
                <td className="px-4 py-3">{e.product_name}</td>
                <td className="px-4 py-3">{e.size}</td>
                <td className="px-4 py-3">{e.color}</td>
                <td className="px-4 py-3"><MovementBadge type={e.movement_type} /></td>
                <td className={`px-4 py-3 font-medium ${e.quantity_change > 0 ? "text-success" : "text-danger"}`}>
                  {e.quantity_change > 0 ? "+" : ""}{e.quantity_change}
                </td>
                <td className="px-4 py-3 font-medium">{e.stock_after}</td>
                <td className="px-4 py-3">{e.unit_cost ? formatCurrency(e.unit_cost, currency) : "—"}</td>
                <td className="px-4 py-3">{e.unit_sale_price ? formatCurrency(e.unit_sale_price, currency) : "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {["sale_void", "purchase_void"].includes(e.movement_type) && (
                    <span className="mr-1 font-medium text-danger">Void reversal:</span>
                  )}
                  {e.notes || "—"}
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
