"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CreatableOption {
  id: string;
  label: string;
  hint?: string;
}

interface CreatableSelectProps {
  name: string;
  value: string;
  onChange: (id: string) => void;
  options: CreatableOption[];
  onOptionsChange?: (options: CreatableOption[]) => void;
  onCreate?: (label: string) => Promise<CreatableOption | null>;
  placeholder?: string;
  createLabel?: (query: string) => string;
}

export function CreatableSelect({
  name,
  value,
  onChange,
  options,
  onOptionsChange,
  onCreate,
  placeholder = "Search...",
  createLabel = (q) => `Add "${q}"`,
}: CreatableSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const selected = options.find((o) => o.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 20);
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.hint?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [options, query]);

  const canCreate =
    onCreate &&
    query.trim().length > 0 &&
    !options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());

  async function handleCreate() {
    if (!onCreate || !query.trim() || creating) return;
    setCreating(true);
    const created = await onCreate(query.trim());
    setCreating(false);
    if (!created) return;
    onOptionsChange?.([...options, created].sort((a, b) => a.label.localeCompare(b.label)));
    onChange(created.id);
    setQuery(created.label);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        value={open ? query : selected?.label || ""}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery(selected?.label || "");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && (canCreate || filtered.length > 0) && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
          {canCreate && (
            <li>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm font-medium text-primary hover:bg-teal-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCreate();
                }}
                disabled={creating}
              >
                {creating ? "Adding..." : createLabel(query.trim())}
              </button>
            </li>
          )}
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                  value === o.id && "bg-teal-50 text-primary"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.id);
                  setQuery(o.label);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{o.label}</span>
                {o.hint && <span className="ml-2 text-muted">{o.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
