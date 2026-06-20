import { cn } from "@/lib/utils";

export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-border bg-card", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 border-b border-border bg-slate-50/95 text-left text-xs uppercase tracking-wide text-muted">
      {children}
    </thead>
  );
}

export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border [&_tr:nth-child(even)]:bg-slate-50/50">{children}</tbody>;
}
