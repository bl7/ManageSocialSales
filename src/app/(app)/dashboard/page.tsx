import Link from "next/link";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const c = stats.currency;

  const cards = [
    { title: "Total Products", value: stats.total_products },
    { title: "Total Variants", value: stats.total_variants },
    { title: "Total Stock Units", value: stats.total_stock_units },
    { title: "Inventory Value", value: formatCurrency(stats.inventory_value, c) },
    { title: "Low Stock Items", value: stats.low_stock_items, warn: stats.low_stock_items > 0 },
    { title: "Out Of Stock", value: stats.out_of_stock_items, danger: stats.out_of_stock_items > 0 },
    { title: "Sales This Month", value: stats.sales_this_month },
    { title: "Units Sold This Month", value: stats.units_sold_this_month },
    { title: "Revenue This Month", value: formatCurrency(stats.revenue_this_month, c) },
    { title: "Est. Profit This Month", value: formatCurrency(stats.profit_this_month, c) },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your inventory and sales">
        <Link href="/sales/new"><Button>Record Sale</Button></Link>
        <Link href="/purchases/new"><Button variant="outline">Record Purchase</Button></Link>
        <Link href="/products/new"><Button variant="outline">Add Product</Button></Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardTitle>{card.title}</CardTitle>
            <CardValue className={
              "warn" in card && card.warn ? "text-warning" :
              "danger" in card && card.danger ? "text-danger" : ""
            }>
              {card.value}
            </CardValue>
          </Card>
        ))}
      </div>
    </div>
  );
}
