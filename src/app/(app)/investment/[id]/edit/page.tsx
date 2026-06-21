import { notFound } from "next/navigation";
import { getInvestmentById } from "@/lib/queries/investments";
import { getAccounts } from "@/lib/queries/accounts";
import { getInvestors } from "@/lib/queries/investors";
import { getSettings } from "@/lib/queries/dashboard";
import { InvestmentForm } from "@/components/forms/investment-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditInvestmentPage({ params }: Props) {
  const { id } = await params;
  const [investment, accounts, investors, settings] = await Promise.all([
    getInvestmentById(id),
    getAccounts(),
    getInvestors(),
    getSettings(),
  ]);

  if (!investment) notFound();

  return (
    <InvestmentForm
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      investors={investors.map((i) => ({ id: i.id, name: i.name }))}
      currency={settings?.currency ?? "Rs."}
      investment={{
        id: investment.id,
        investor_id: investment.investor_id,
        investment_date: investment.investment_date,
        notes: investment.notes,
        allocations: investment.allocations,
      }}
    />
  );
}
