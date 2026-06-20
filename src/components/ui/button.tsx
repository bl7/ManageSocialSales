import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 active:scale-[0.99]",
          variant === "default" && "bg-foreground text-primary-foreground hover:bg-slate-800 shadow-sm",
          variant === "outline" && "border border-border bg-card hover:bg-slate-50",
          variant === "ghost" && "hover:bg-slate-100",
          variant === "danger" && "bg-danger text-white hover:bg-red-700",
          size === "sm" && "h-9 px-3 text-sm",
          size === "md" && "h-11 px-4 text-sm",
          size === "lg" && "h-12 px-6 text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
