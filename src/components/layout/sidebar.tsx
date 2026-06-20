"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Products", icon: "👕" },
  { href: "/purchases/new", label: "Record Purchase", icon: "📦" },
  { href: "/sales/new", label: "Record Sale", icon: "💰" },
  { href: "/adjustments/new", label: "Stock Adjustment", icon: "⚖️" },
  { href: "/ledger", label: "Stock Ledger", icon: "📋" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="border-b border-border px-4 py-5">
        <h2 className="text-lg font-bold text-primary">{businessName}</h2>
        <p className="text-xs text-muted">Inventory Management</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-slate-100"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" className="w-full justify-start">
            Logout
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card md:hidden">
        <div className="flex overflow-x-auto">
          {navItems.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[72px] flex-1 flex-col items-center py-2 text-xs",
                  active ? "text-primary font-medium" : "text-muted"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="mt-0.5 truncate px-1">{item.label.split(" ").pop()}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setOpen(true)}
            className="flex min-w-[72px] flex-1 flex-col items-center py-2 text-xs text-muted"
          >
            <span className="text-lg">☰</span>
            <span className="mt-0.5">More</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute bottom-0 left-0 right-0 flex max-h-[80vh] flex-col rounded-t-2xl bg-card">
            <NavContent />
          </aside>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:fixed md:inset-y-0 md:flex">
        <NavContent />
      </aside>
    </>
  );
}
