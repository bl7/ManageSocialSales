"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
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
} from "lucide-react";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Shirt },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/purchases", label: "Purchases", icon: PackagePlus },
  { href: "/parties", label: "Parties", icon: Users },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/ledger", label: "Stock Ledger", icon: ScrollText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/investment", label: "Investment", icon: PiggyBank },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobilePrimary = mainNav.slice(0, 4);
const mobileMore = mainNav.slice(4);

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/sales") return pathname === "/sales" || pathname.startsWith("/sales/");
  if (href === "/purchases") return pathname === "/purchases" || pathname.startsWith("/purchases/");
  if (href === "/settings") return pathname === "/settings" || pathname.startsWith("/settings");
  if (href === "/parties") return pathname === "/parties" || pathname.startsWith("/parties/") || pathname === "/credit";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ businessName, logoUrl }: { businessName: string; logoUrl?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const moreActive = mobileMore.some((item) => isNavActive(pathname, item.href));

  const NavContent = () => (
    <>
      <div className="border-b border-white/10 px-4 py-5">
        <div className="flex items-center gap-3">
          {logoUrl && !logoError ? (
            <img src={logoUrl} alt={businessName} className="h-10 w-10 rounded-xl object-cover" onError={() => setLogoError(true)} />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
              {businessName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-base font-bold text-sidebar-foreground">{businessName}</h2>
            <p className="text-xs text-sidebar-muted">Inventory Management</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" className="w-full justify-start text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground">
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="font-bold text-primary">{businessName}</div>
        <button type="button" onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-slate-100">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar">
            <NavContent />
          </aside>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card md:hidden">
        {mobilePrimary.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-1 flex-col items-center py-2 text-[10px]", active ? "font-medium text-primary" : "text-muted")}>
              <Icon className="h-5 w-5" />
              <span className="mt-0.5 truncate px-1">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={cn("flex flex-1 flex-col items-center py-2 text-[10px]", moreActive || moreOpen ? "font-medium text-primary" : "text-muted")}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="mt-0.5">More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-16 left-4 right-4 rounded-xl border border-border bg-card p-2 shadow-lg" onClick={(e) => e.stopPropagation()}>
            {mobileMore.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  {item.label}
                </Link>
              );
            })}
            <Link href="/sales/new" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-primary hover:bg-teal-50">
              <ShoppingCart className="h-5 w-5" />
              Record Sale
            </Link>
          </div>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar md:fixed md:inset-y-0 md:flex">
        <NavContent />
      </aside>
    </>
  );
}
