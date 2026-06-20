import {
  getBestSellingProducts,
  getSlowMovingProducts,
  getLowStockReport,
  getOutOfStockReport,
  getInventoryValuation,
  getRevenueReport,
  getProfitReport,
} from "@/lib/queries/reports";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { ReportsFilters } from "@/components/reports/reports-filters";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [bestSelling, slowMoving, lowStock, outOfStock, valuation, revenue, profit, settings] =
    await Promise.all([
      getBestSellingProducts(params.dateFrom, params.dateTo),
      getSlowMovingProducts(),
      getLowStockReport(),
      getOutOfStockReport(),
      getInventoryValuation(),
      getRevenueReport(params.dateFrom, params.dateTo),
      getProfitReport(params.dateFrom, params.dateTo),
      getSettings(),
    ]);

  const currency = settings?.currency ?? "Rs.";
  const totalValuation = valuation.reduce((s, r) => s + Number(r.total_value), 0);
  const totalProfit = profit.reduce((s, r) => s + Number(r.estimated_profit), 0);

  function ReportTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
    if (rows.length === 0) return <p className="text-sm text-muted">No data available.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              {headers.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => <td key={j} className="px-3 py-2">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports" description="Business insights and inventory analysis" />

      <ReportsFilters dateFrom={params.dateFrom} dateTo={params.dateTo} />

      <div className="grid gap-6">
        <Card>
          <h3 className="mb-4 font-semibold">Best Selling Products</h3>
          <ReportTable
            headers={["Product", "Size", "Color", "Sold", "Revenue"]}
            rows={bestSelling.map((r) => [
              r.product_name, r.size, r.color, r.total_sold,
              formatCurrency(r.total_revenue, currency),
            ])}
          />
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Slow Moving Products</h3>
          <ReportTable
            headers={["Product", "Size", "Color", "Sold", "Stock"]}
            rows={slowMoving.map((r) => [
              r.product_name, r.size, r.color, r.total_sold, r.current_stock,
            ])}
          />
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="mb-4 font-semibold">Low Stock ({lowStock.length})</h3>
            <ReportTable
              headers={["Product", "Size", "Color", "Stock", "Reorder"]}
              rows={lowStock.map((r) => [
                r.product_name, r.size, r.color, r.current_stock, r.reorder_level,
              ])}
            />
          </Card>

          <Card>
            <h3 className="mb-4 font-semibold">Out of Stock ({outOfStock.length})</h3>
            <ReportTable
              headers={["Product", "Size", "Color", "Stock"]}
              rows={outOfStock.map((r) => [
                r.product_name, r.size, r.color, r.current_stock,
              ])}
            />
          </Card>
        </div>

        <Card>
          <h3 className="mb-1 font-semibold">Inventory Valuation</h3>
          <p className="mb-4 text-2xl font-bold">{formatCurrency(totalValuation, currency)}</p>
          <ReportTable
            headers={["Product", "Size", "Color", "Stock", "Unit Cost", "Value"]}
            rows={valuation.map((r) => [
              r.product_name, r.size, r.color, r.current_stock,
              formatCurrency(r.unit_cost, currency),
              formatCurrency(r.total_value, currency),
            ])}
          />
        </Card>

        <Card>
          <h3 className="mb-1 font-semibold">Revenue Report</h3>
          <p className="mb-4 text-2xl font-bold">
            {formatCurrency(revenue.total?.total_revenue ?? 0, currency)}
            <span className="ml-2 text-sm font-normal text-muted">
              ({revenue.total?.total_units ?? 0} units)
            </span>
          </p>
          <ReportTable
            headers={["Date", "Platform", "Sales", "Units", "Revenue"]}
            rows={revenue.rows.map((r) => [
              formatDate(r.sale_date), r.platform, r.sale_count, r.units_sold,
              formatCurrency(r.revenue, currency),
            ])}
          />
        </Card>

        <Card>
          <h3 className="mb-1 font-semibold">Estimated Profit Report</h3>
          <p className="mb-4 text-2xl font-bold">{formatCurrency(totalProfit, currency)}</p>
          <ReportTable
            headers={["Date", "Product", "Qty", "Revenue", "Est. Cost", "Est. Profit"]}
            rows={profit.map((r) => [
              formatDate(r.sale_date), `${r.product_name} ${r.size}/${r.color}`,
              r.quantity, formatCurrency(r.revenue, currency),
              formatCurrency(r.estimated_cost, currency),
              formatCurrency(r.estimated_profit, currency),
            ])}
          />
        </Card>
      </div>
    </div>
  );
}
