"use client";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={loading ? undefined : onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-muted">{message}</div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading}>
            {loading ? "Saving..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
