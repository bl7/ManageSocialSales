import Link from "next/link";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Banknote,
  Wallet,
} from "lucide-react";

interface StatCardsProps {
  stats: {
    total_products: number;
    total_variants: number;
    total_stock_units: number;
    inventory_value: number;
    low_stock_items: number;
    out_of_stock_items: number;
    sales_this_month: number;
    units_sold_this_month: number;
    revenue_this_month: number;
    profit_this_month: number;
    total_receivables: number;
    total_payables: number;
    currency: string;
  };
}

export function StatCards({ stats }: StatCardsProps) {
  const c = stats.currency;

  const cards: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    href?: string;
    warn?: boolean;
    danger?: boolean;
    highlight?: boolean;
  }[] = [
    { title: "Inventory Value", value: formatCurrency(stats.inventory_value, c), icon: <DollarSign className="h-5 w-5" /> },
    {
      title: "Revenue This Month",
      value: formatCurrency(stats.revenue_this_month, c),
      icon: <Banknote className="h-5 w-5" />,
      href: "/reports",
      highlight: true,
    },
    {
      title: "Profit This Month",
      value: formatCurrency(stats.profit_this_month, c),
      subtitle: "Based on default cost prices",
      icon: <TrendingUp className="h-5 w-5" />,
      href: "/reports",
      highlight: true,
    },
    {
      title: "Money Owed To You",
      value: formatCurrency(stats.total_receivables, c),
      icon: <Wallet className="h-5 w-5" />,
      href: "/parties?tab=to-collect",
      warn: stats.total_receivables > 0,
    },
    {
      title: "Money You Owe",
      value: formatCurrency(stats.total_payables, c),
      icon: <Wallet className="h-5 w-5" />,
      href: "/parties?tab=to-pay",
      warn: stats.total_payables > 0,
    },
    {
      title: "Low Stock Items",
      value: stats.low_stock_items + stats.out_of_stock_items,
      subtitle: `${stats.out_of_stock_items} out of stock`,
      icon: <AlertTriangle className="h-5 w-5" />,
      href: "/products?stockStatus=low_stock",
      warn: stats.low_stock_items + stats.out_of_stock_items > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const inner = (
          <Card
            className={cn(
              "transition-all hover:shadow-md",
              card.href && "cursor-pointer hover:border-primary/40",
              card.highlight && "border-primary/30 bg-gradient-to-br from-teal-50/80 to-white"
            )}
          >
            <div className="flex items-start justify-between">
              <CardTitle>{card.title}</CardTitle>
              <span className="text-primary/70">{card.icon}</span>
            </div>
            <CardValue
              className={cn(
                card.warn && "text-warning",
                card.danger && "text-danger",
                card.highlight && "text-primary"
              )}
            >
              {card.value}
            </CardValue>
            {card.subtitle && (
              <p className="mt-1 text-xs text-muted">{card.subtitle}</p>
            )}
          </Card>
        );
        return card.href ? (
          <Link key={card.title} href={card.href}>{inner}</Link>
        ) : (
          <div key={card.title}>{inner}</div>
        );
      })}
    </div>
  );
}
