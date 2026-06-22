import Link from "next/link";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getDateFormatters } from "@/lib/date-preference.server";
import type { ProductInsightSummary } from "@/lib/queries/insights";

export async function ProductInsightsCard({
  summary,
  currency,
  productId,
}: {
  summary: ProductInsightSummary;
  currency: string;
  productId: string;
}) {
  const { formatDate } = await getDateFormatters();

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-teal-50/50 to-white">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <CardTitle>Product Insights</CardTitle>
          <p className="mt-1 text-sm text-muted">This month · smart suggestions for this product</p>
        </div>
        <Link href={`/insights?product=${productId}`}>
          <Button variant="outline" size="sm">Full insights</Button>
        </Link>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted">Units sold</p>
          <CardValue className="text-lg">{summary.unitsSold}</CardValue>
        </div>
        <div>
          <p className="text-xs text-muted">Revenue</p>
          <CardValue className="text-lg">{formatCurrency(summary.revenue, currency)}</CardValue>
        </div>
        <div>
          <p className="text-xs text-muted">Est. profit</p>
          <CardValue className="text-lg text-primary">{formatCurrency(summary.profit, currency)}</CardValue>
        </div>
        <div>
          <p className="text-xs text-muted">Stock value</p>
          <CardValue className="text-lg">{formatCurrency(summary.stockValue, currency)}</CardValue>
        </div>
      </div>

      {summary.bestVariant && (
        <p className="mb-2 text-sm">
          <span className="text-muted">Best seller: </span>
          <span className="font-medium">{summary.bestVariant.color} / {summary.bestVariant.size}</span>
          {" "}({summary.bestVariant.units_sold} sold)
        </p>
      )}
      {summary.lastSoldDate && (
        <p className="mb-3 text-sm text-muted">Last sold: {formatDate(summary.lastSoldDate)}</p>
      )}
      <p className="rounded-lg border border-border bg-white/80 p-3 text-sm">{summary.recommendation}</p>
    </Card>
  );
}
