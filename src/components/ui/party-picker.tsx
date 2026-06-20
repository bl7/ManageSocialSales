"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Party {
  id: string;
  name: string;
  phone?: string | null;
}

interface PartyPickerProps {
  parties: Party[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export function PartyPicker({ parties, value, onChange, placeholder = "Search customer..." }: PartyPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = parties.find((p) => p.id === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return parties.slice(0, 20);
    return parties.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone?.includes(q)
    ).slice(0, 20);
  }, [parties, query]);

  return (
    <div className="relative">
      <Input
        value={open ? query : selected?.name || ""}
        placeholder={placeholder}
        onFocus={() => { setOpen(true); setQuery(selected?.name || ""); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                  value === p.id && "bg-teal-50 text-primary"
                )}
                onMouseDown={() => { onChange(p.id); setQuery(p.name); setOpen(false); }}
              >
                <span className="font-medium">{p.name}</span>
                {p.phone && <span className="ml-2 text-muted">{p.phone}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <input type="hidden" name="party_id" value={value} />
    </div>
  );
}
