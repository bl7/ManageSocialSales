"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VariantOption {
  id: string;
  product_name: string;
  size: string;
  color: string;
  current_stock: number;
  default_selling_price?: string;
  default_cost_price?: string;
}

interface VariantPickerProps {
  variants: VariantOption[];
  value: string;
  onChange: (variantId: string) => void;
  showStock?: boolean;
  placeholder?: string;
}

export function VariantPicker({
  variants,
  value,
  onChange,
  showStock = true,
  placeholder = "Search product, size, color...",
}: VariantPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = variants.find((v) => v.id === value);
  const filtered = variants.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.product_name.toLowerCase().includes(q) ||
      v.size.toLowerCase().includes(q) ||
      v.color.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-left text-sm hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <span className={cn(!selected && "text-muted")}>
          {selected
            ? `${selected.product_name} — ${selected.size} / ${selected.color}${showStock ? ` (Stock: ${selected.current_stock})` : ""}`
            : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="h-9 w-full rounded-lg border border-border pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted">No variants found</li>
            ) : (
              filtered.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(v.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-teal-50"
                  >
                    {value === v.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    <span className={cn(value !== v.id && "pl-6")}>
                      <span className="font-medium">{v.product_name}</span>
                      <span className="text-muted"> — {v.size} / {v.color}</span>
                      {showStock && (
                        <span className={cn(
                          "ml-2 rounded-full px-2 py-0.5 text-xs",
                          v.current_stock <= 0 ? "bg-red-100 text-red-700" :
                          v.current_stock <= 5 ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        )}>
                          {v.current_stock} in stock
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
