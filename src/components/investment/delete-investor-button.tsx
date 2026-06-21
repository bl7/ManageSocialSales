"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteInvestorAction } from "@/actions/investors";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteInvestorButton({ investorId, name }: { investorId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteInvestorAction(investorId);
    if (result.success) {
      toast.success(`${name} deactivated`);
      router.refresh();
      setOpen(false);
      return;
    }
    toast.error(result.error);
    setPending(false);
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} disabled={pending}>
        Deactivate
      </Button>
      <ConfirmDialog
        open={open}
        title={`Deactivate ${name}?`}
        message="They will no longer appear in investor lists. Existing investments are kept."
        confirmLabel="Deactivate"
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
        loading={pending}
      />
    </>
  );
}
