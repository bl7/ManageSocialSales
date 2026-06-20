import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { SummaryGrid } from "@/components/ui/page";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Receipt, TrendingDown } from "lucide-react";

interface Props {
  total: number;
  count: number;
  currency: string;
}

export function ExpensesSummaryCards({ total, count, currency }: Props) {
  const average = count > 0 ? total / count : 0;

  const cards = [
    { title: "Total Expenses", value: formatCurrency(total, currency), icon: <Wallet className="h-5 w-5" />, highlight: true },
    { title: "Transactions", value: count, icon: <Receipt className="h-5 w-5" /> },
    { title: "Average", value: formatCurrency(average, currency), icon: <TrendingDown className="h-5 w-5" /> },
  ];

  return (
    <SummaryGrid cols={3}>
      {cards.map((card) => (
        <Card
          key={card.title}
          className={card.highlight ? "border-primary/30 bg-gradient-to-br from-teal-50/80 to-white" : ""}
        >
          <div className="flex items-start justify-between">
            <CardTitle>{card.title}</CardTitle>
            <span className="text-primary/70">{card.icon}</span>
          </div>
          <CardValue className={card.highlight ? "text-primary" : ""}>{card.value}</CardValue>
        </Card>
      ))}
    </SummaryGrid>
  );
}
