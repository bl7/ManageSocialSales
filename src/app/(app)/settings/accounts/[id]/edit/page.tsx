import { notFound } from "next/navigation";
import { getAccountById, getAccountLedgerCount } from "@/lib/queries/accounts";
import { getSettings } from "@/lib/queries/dashboard";
import { AccountForm } from "@/components/forms/account-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAccountPage({ params }: Props) {
  const { id } = await params;
  const [account, ledgerCount, settings] = await Promise.all([
    getAccountById(id),
    getAccountLedgerCount(id),
    getSettings(),
  ]);
  if (!account || !account.is_active) notFound();

  return (
    <AccountForm
      account={account}
      currency={settings?.currency ?? "Rs."}
      ledgerCount={ledgerCount}
    />
  );
}
