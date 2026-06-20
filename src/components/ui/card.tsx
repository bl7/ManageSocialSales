import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-sm font-medium text-muted", className)}>{children}</h3>;
}

export function CardValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-2 text-3xl font-bold", className)}>{children}</p>;
}
