"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { useFormatDate } from "@/components/providers/date-preference-provider";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layout/sidebar-context";
import {
  LayoutDashboard,
  Lightbulb,
  ArrowLeftRight,
  Shirt,
  PackagePlus,
  Receipt,
  Users,
  Wallet,
  PiggyBank,
  ScrollText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  ShoppingCart,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/products", label: "Products", icon: Shirt },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/purchases", label: "Purchases", icon: PackagePlus },
  { href: "/parties", label: "Parties", icon: Users },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/ledger", label: "Stock History", icon: ScrollText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/investment", label: "Investment", icon: PiggyBank },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobilePrimary = mainNav.slice(0, 4);
const mobileMore = mainNav.slice(4);

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/insights")
    return pathname === "/insights" || pathname.startsWith("/insights/");
  if (href === "/transactions") return pathname === "/transactions";
  if (href === "/sales")
    return pathname === "/sales" || pathname.startsWith("/sales/") || pathname.startsWith("/pos/");
  if (href === "/purchases")
    return pathname === "/purchases" || pathname.startsWith("/purchases/");
  if (href === "/settings")
    return pathname === "/settings" || pathname.startsWith("/settings");
  if (href === "/parties")
    return (
      pathname === "/parties" ||
      pathname.startsWith("/parties/") ||
      pathname === "/credit"
    );
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  businessName,
  logoUrl,
  monthRevenue = 0,
  currency = "Rs.",
}: {
  businessName: string;
  logoUrl?: string | null;
  monthRevenue?: number;
  currency?: string;
}) {
  const pathname = usePathname();
  const { formatMonthLong } = useFormatDate();
  const { collapsed, toggleCollapsed, width } = useSidebar();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
    setOpen(false);
  }, [pathname]);

  const moreActive = mobileMore.some((item) =>
    isNavActive(pathname, item.href),
  );

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div
        className={cn(
          "border-b border-white/10 px-4 py-5",
          collapsed && !mobile && "px-3 py-4",
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center text-center",
            collapsed && !mobile && "items-center",
          )}
        >
          {logoUrl && !logoError ? (
            <img
              src={logoUrl}
              alt={businessName}
              className={cn(
                "shrink-0 rounded-xl object-cover",
                collapsed && !mobile ? "h-10 w-10" : "h-12 w-12",
              )}
              onError={() => setLogoError(true)}
            />
          ) : (
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl bg-primary font-bold text-white",
                collapsed && !mobile
                  ? "h-10 w-10 text-lg"
                  : "h-12 w-12 text-xl",
              )}
            >
              {businessName.charAt(0).toUpperCase()}
            </div>
          )}
          {(!collapsed || mobile) && (
            <h2 className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-sidebar-foreground">
              {businessName}
            </h2>
          )}
        </div>
        {(!collapsed || mobile) && (
          <>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-sidebar-muted">
                {formatMonthLong()} revenue
              </p>
              <p className="mt-1 text-base font-semibold text-sidebar-foreground">
                {formatCurrency(monthRevenue, currency)}
              </p>
            </div>
            <Link
              href="/pos/new"
              onClick={() => setOpen(false)}
              className="mt-3 block"
            >
              <Button className="w-full justify-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                POS
              </Button>
            </Link>
            <Link
              href="/quick-entry"
              onClick={() => setOpen(false)}
              className="mt-2 block"
            >
              <Button variant="outline" className="w-full justify-center">
                Quick Entry
              </Button>
            </Link>
          </>
        )}
        {collapsed && !mobile && (
          <Link
            href="/pos/new"
            onClick={() => setOpen(false)}
            className="mt-4 flex justify-center"
            title="POS"
          >
            <Button size="sm" className="h-10 w-10 p-0">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      <nav
        className={cn(
          "flex-1 space-y-0.5 overflow-y-auto p-3",
          collapsed && !mobile && "px-2",
        )}
      >
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              title={collapsed && !mobile ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-colors",
                collapsed && !mobile
                  ? "justify-center px-2 py-2.5"
                  : "gap-3 px-3 py-2.5",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(!collapsed || mobile) && item.label}
            </Link>
          );
        })}
      </nav>
      <div
        className={cn(
          "border-t border-white/10 p-3",
          collapsed && !mobile && "px-2",
        )}
      >
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            title={collapsed && !mobile ? "Logout" : undefined}
            className={cn(
              "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground",
              collapsed && !mobile
                ? "h-10 w-full justify-center px-0"
                : "w-full justify-start",
            )}
          >
            <LogOut
              className={cn("h-5 w-5", !collapsed || mobile ? "mr-3" : "")}
            />
            {(!collapsed || mobile) && "Logout"}
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="font-bold text-primary">{businessName}</div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-xl p-2 hover:bg-slate-100"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar">
            <NavContent mobile />
          </aside>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card md:hidden">
        {mobilePrimary.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center py-2 text-[10px]",
                active ? "font-medium text-primary" : "text-muted",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-0.5 truncate px-1">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={cn(
            "flex flex-1 flex-col items-center py-2 text-[10px]",
            moreActive || moreOpen ? "font-medium text-primary" : "text-muted",
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="mt-0.5">More</span>
        </button>
      </nav>

      {moreOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-16 left-4 right-4 rounded-2xl border border-border bg-card p-2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {mobileMore.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-slate-50"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/pos/new"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-primary hover:bg-teal-50"
            >
              <ShoppingCart className="h-5 w-5" />
              POS
            </Link>
            <Link
              href="/quick-entry"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-slate-50"
            >
              Quick Entry
            </Link>
          </div>
        </div>
      )}

      <aside
        className="group/sidebar fixed inset-y-0 left-0 z-30 hidden flex-col bg-sidebar transition-[width] duration-300 ease-in-out md:flex"
        style={{ width }}
      >
        <NavContent />
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-1/2 z-40 flex h-12 w-6 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full border border-border bg-card text-muted shadow-md transition-colors hover:bg-slate-50 hover:text-foreground"
        >
          <GripVertical className="h-3 w-3 opacity-50" />
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>
    </>
  );
}
