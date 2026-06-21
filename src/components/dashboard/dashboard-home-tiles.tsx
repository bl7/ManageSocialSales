import Link from "next/link";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  PackagePlus,
  Wallet,
  Landmark,
  ChevronRight,
} from "lucide-react";

interface Props {
  stats: {
    total_receivables: number;
    total_payables: number;
    revenue_this_month: number;
    purchases_this_month: number;
    expenses_this_month: number;
    total_balance: number;
    currency: string;
  };
  monthLabel: string;
}

export function DashboardHomeTiles({ stats, monthLabel }: Props) {
  const c = stats.currency;

  const tiles = [
    {
      title: "To Receive",
      value: formatCurrency(stats.total_receivables, c),
      href: "/parties?tab=to-collect",
      icon: <ArrowDownLeft className="h-5 w-5" />,
      className: "border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white",
      valueClassName: "text-success",
    },
    {
      title: "To Give",
      value: formatCurrency(stats.total_payables, c),
      href: "/parties?tab=to-pay",
      icon: <ArrowUpRight className="h-5 w-5" />,
      className: "border-rose-200 bg-gradient-to-br from-rose-50/90 to-white",
      valueClassName: "text-danger",
    },
    {
      title: "Sales",
      subtitle: monthLabel,
      value: formatCurrency(stats.revenue_this_month, c),
      href: "/sales",
      icon: <Receipt className="h-5 w-5" />,
      className: "",
      valueClassName: "",
    },
    {
      title: "Purchase",
      subtitle: monthLabel,
      value: formatCurrency(stats.purchases_this_month, c),
      href: "/purchases",
      icon: <PackagePlus className="h-5 w-5" />,
      className: "",
      valueClassName: "",
    },
    {
      title: "Expense",
      subtitle: monthLabel,
      value: formatCurrency(stats.expenses_this_month, c),
      href: "/expenses",
      icon: <Wallet className="h-5 w-5" />,
      className: "",
      valueClassName: "",
    },
    {
      title: "Total Balance",
      subtitle: "Cash & Bank",
      value: formatCurrency(stats.total_balance, c),
      href: "/transactions",
      icon: <Landmark className="h-5 w-5" />,
      className: "border-primary/30 bg-gradient-to-br from-slate-50 to-white",
      valueClassName: "text-primary",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tiles.map((tile) => (
        <Link key={tile.title} href={tile.href}>
          <Card className={cn("h-full transition-all hover:border-primary/30 hover:shadow-md", tile.className)}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{tile.title}</CardTitle>
                {"subtitle" in tile && tile.subtitle && (
                  <p className="mt-0.5 text-xs text-muted">{tile.subtitle}</p>
                )}
              </div>
              <span className="flex items-center gap-1 text-muted">
                <span className="text-primary/70">{tile.icon}</span>
                <ChevronRight className="h-4 w-4 opacity-40" />
              </span>
            </div>
            <CardValue className={cn("mt-3", tile.valueClassName)}>{tile.value}</CardValue>
          </Card>
        </Link>
      ))}
    </div>
  );
}
