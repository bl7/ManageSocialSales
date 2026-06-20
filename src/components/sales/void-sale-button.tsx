"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { voidSaleAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormGroup, Label } from "@/components/ui/page";

export function VoidSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function handleVoid() {
    if (!reason.trim()) {
      toast.error("Please enter a reason");
      return;
    }
    setPending(true);
    const result = await voidSaleAction(saleId, reason);
    if (result.success) {
      toast.success("Sale voided — stock restored");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setPending(false);
  }

  return (
    <>
      <Button type="button" variant="outline" className="text-danger" onClick={() => setOpen(true)}>
        Void Sale
      </Button>
      <ConfirmDialog
        open={open}
        title="Void this sale?"
        message={
          <div className="space-y-3 text-left">
            <p className="text-sm text-muted">Stock will be restored. This cannot be undone.</p>
            <FormGroup>
              <Label htmlFor="void_reason">Reason *</Label>
              <Input id="void_reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Wrong entry" />
            </FormGroup>
          </div>
        }
        confirmLabel="Void Sale"
        onConfirm={handleVoid}
        onCancel={() => setOpen(false)}
        loading={pending}
      />
    </>
  );
}
