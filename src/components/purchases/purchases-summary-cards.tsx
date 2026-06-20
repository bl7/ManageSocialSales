import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { SummaryGrid } from "@/components/ui/page";
import { formatCurrency } from "@/lib/utils";
import { PackagePlus, Banknote, CreditCard } from "lucide-react";

interface Props {
  summary: {
    purchase_count: number;
    total: number;
    credit_due: number;
  };
  currency: string;
}

export function PurchasesSummaryCards({ summary, currency }: Props) {
  const cards = [
    { title: "Purchases", value: summary.purchase_count, icon: <PackagePlus className="h-5 w-5" /> },
    { title: "Total Cost", value: formatCurrency(summary.total, currency), icon: <Banknote className="h-5 w-5" />, highlight: true },
    {
      title: "Credit Due",
      value: formatCurrency(summary.credit_due, currency),
      icon: <CreditCard className="h-5 w-5" />,
      highlight: true,
      warning: true,
    },
  ];

  return (
    <SummaryGrid cols={3}>
      {cards.map((card) => (
        <Card
          key={card.title}
          className={
            card.highlight
              ? card.warning
                ? "border-warning/30 bg-gradient-to-br from-amber-50/80 to-white"
                : "border-primary/30 bg-gradient-to-br from-teal-50/80 to-white"
              : ""
          }
        >
          <div className="flex items-start justify-between">
            <CardTitle>{card.title}</CardTitle>
            <span className={card.warning ? "text-warning/70" : "text-primary/70"}>{card.icon}</span>
          </div>
          <CardValue className={card.warning ? "text-warning" : card.highlight ? "text-primary" : ""}>
            {card.value}
          </CardValue>
        </Card>
      ))}
    </SummaryGrid>
  );
}
