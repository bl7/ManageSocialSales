import Link from "next/link";
import {
  ShoppingCart,
  PackagePlus,
  Plus,
  UserPlus,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";

const shortcuts = [
  { href: "/sales/new", label: "Record Sale", icon: ShoppingCart },
  { href: "/purchases/new", label: "Purchase", icon: PackagePlus },
  { href: "/products/new", label: "Add Product", icon: Plus },
  { href: "/parties/new", label: "Add Party", icon: UserPlus },
  { href: "/expenses?new=1", label: "Expense", icon: Wallet },
  { href: "/parties?tab=to-collect", label: "To Collect", icon: ArrowDownLeft },
  { href: "/parties?tab=to-pay", label: "To Pay", icon: ArrowUpRight },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function DashboardShortcuts() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Shortcuts</h2>
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
