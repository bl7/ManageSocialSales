"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function MainArea({ children }: { children: React.ReactNode }) {
  const { width } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <main
      className={cn("transition-[padding-left] duration-300 ease-in-out")}
      style={{ paddingLeft: isDesktop ? width : 0 }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 md:px-6 md:pb-8 md:pt-8">
        {children}
      </div>
    </main>
  );
}

export function AppShell({
  children,
  businessName,
  logoUrl,
  monthRevenue,
  currency,
}: {
  children: React.ReactNode;
  businessName: string;
  logoUrl?: string | null;
  monthRevenue?: number;
  currency?: string;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar
          businessName={businessName}
          logoUrl={logoUrl}
          monthRevenue={monthRevenue}
          currency={currency}
        />
        <MainArea>{children}</MainArea>
      </div>
    </SidebarProvider>
  );
}
