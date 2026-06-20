"use client";

import { Toaster } from "sonner";
import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

const TOAST_MESSAGES: Record<string, string> = {
  "sale-recorded": "Sale recorded successfully",
  "purchase-recorded": "Purchase recorded successfully",
  "adjustment-recorded": "Stock adjustment recorded",
  "product-saved": "Product saved successfully",
  "settings-saved": "Settings updated",
};

function ToastFromQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const key = searchParams.get("toast");
    if (!key || !TOAST_MESSAGES[key]) return;
    toast.success(TOAST_MESSAGES[key]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, router, pathname]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
      <ToastFromQuery />
    </>
  );
}
