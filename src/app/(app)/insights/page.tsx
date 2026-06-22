import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page";
import { InsightsDateFilters } from "@/components/insights/insights-date-filters";
import { InsightCard } from "@/components/insights/insight-card";
import { ProductPerformanceTable } from "@/components/insights/product-performance-table";
import { RestockSuggestions, ClearanceSuggestions } from "@/components/insights/insight-sections";
import { CreditInsightsSection } from "@/components/insights/credit-insights-section";
import { getSettings } from "@/lib/queries/dashboard";
import {
  getVariantPerformance,
  getTopInsightCards,
  getCreditInsights,
  getInsightFilterOptions,
  hasSalesData,
  hasPurchaseCostData,
} from "@/lib/queries/insights";
import { resolveInsightsDateRange } from "@/lib/date-ranges";
import { getDateCalendar } from "@/lib/date-preference.server";

interface Props {
  searchParams: Promise<{
    preset?: string;
    dateFrom?: string;
    dateTo?: string;
    filter?: string;
    section?: string;
    product?: string;
  }>;
}

export default async function InsightsPage({ searchParams }: Props) {
  const params = await searchParams;
  const calendar = await getDateCalendar();
  const { from, to } = resolveInsightsDateRange(params, calendar);

  const [settings, performance, filterOptions, salesExist, costExist, credit] =
    await Promise.all([
      getSettings(),
      getVariantPerformance(from, to),
      getInsightFilterOptions(),
      hasSalesData(),
      hasPurchaseCostData(),
      getCreditInsights(),
    ]);

  const currency = settings?.currency ?? "Rs.";
  const cards = await getTopInsightCards(from, to, currency);
  const filteredPerformance = params.product
    ? performance.filter((r) => r.product_id === params.product)
    : performance;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Business Insights"
        description="Smart suggestions based on your sales, stock, credit and cashflow."
      />

      <Suspense fallback={null}>
        <InsightsDateFilters />
      </Suspense>

      {!salesExist && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted">
          Not enough sales data yet. Record a few sales and Insights will show best sellers, profit trends, and restock suggestions.
        </div>
      )}

      {!costExist && salesExist && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add purchase costs to calculate profit and stock value more accurately. Variant default costs are used as fallback.
        </div>
      )}

      {salesExist && cards.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Smart Insights</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <InsightCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      <section id="restock">
        <h2 className="mb-4 text-xl font-semibold">Restock Suggestions</h2>
        <RestockSuggestions rows={filteredPerformance} currency={currency} />
      </section>

      <section id="clearance">
        <h2 className="mb-4 text-xl font-semibold">Clearance Suggestions</h2>
        <ClearanceSuggestions rows={filteredPerformance} currency={currency} />
      </section>

      <section id="credit">
        <h2 className="mb-4 text-xl font-semibold">Credit Insights</h2>
        <CreditInsightsSection data={credit} currency={currency} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Product Performance</h2>
        {salesExist ? (
          <ProductPerformanceTable
            rows={filteredPerformance}
            currency={currency}
            categories={filterOptions.categories}
            sizes={filterOptions.sizes}
            colors={filterOptions.colors}
            initialFilter={params.filter}
          />
        ) : (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
            Product performance will appear here once you have sales in the selected period.
          </p>
        )}
      </section>
    </div>
  );
}
