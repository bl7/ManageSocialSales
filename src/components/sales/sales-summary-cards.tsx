import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Package, Banknote, TrendingUp } from "lucide-react";

interface Props {
  summary: {
    sale_count: number;
    units_sold: number;
    revenue: number;
    estimated_profit: number;
  };
  currency: string;
}

export function SalesSummaryCards({ summary, currency }: Props) {
  const cards = [
    { title: "Sales", value: summary.sale_count, icon: <ShoppingCart className="h-5 w-5" /> },
    { title: "Units Sold", value: summary.units_sold, icon: <Package className="h-5 w-5" /> },
    { title: "Revenue", value: formatCurrency(summary.revenue, currency), icon: <Banknote className="h-5 w-5" />, highlight: true },
    {
      title: "Est. Profit",
      value: formatCurrency(summary.estimated_profit, currency),
      subtitle: "Based on default cost prices",
      icon: <TrendingUp className="h-5 w-5" />,
      highlight: true,
    },
  ];

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className={card.highlight ? "border-primary/30 bg-gradient-to-br from-teal-50/80 to-white" : ""}>
          <div className="flex items-start justify-between">
            <CardTitle>{card.title}</CardTitle>
            <span className="text-primary/70">{card.icon}</span>
          </div>
          <CardValue className={card.highlight ? "text-primary" : ""}>{card.value}</CardValue>
          {"subtitle" in card && card.subtitle && (
            <p className="mt-1 text-xs text-muted">{card.subtitle}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
