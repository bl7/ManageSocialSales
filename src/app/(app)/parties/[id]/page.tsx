import { notFound } from "next/navigation";
import Link from "next/link";
import { getPartyById, getPartyLedger } from "@/lib/queries/parties";
import { getSettings } from "@/lib/queries/dashboard";
import { getAccounts } from "@/lib/queries/accounts";
import { PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { PaymentForm } from "@/components/forms/payment-form";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const ENTRY_LABELS: Record<string, string> = {
  sale: "Sale (udhar)",
  purchase: "Purchase (credit)",
  payment_in: "Payment received",
  payment_out: "Payment made",
  opening: "Opening balance",
};

export default async function PartyDetailPage({ params }: Props) {
  const { id } = await params;
  const [party, ledger, accounts, settings] = await Promise.all([
    getPartyById(id),
    getPartyLedger(id),
    getAccounts(),
    getSettings(),
  ]);

  if (!party) notFound();

  const currency = settings?.currency ?? "Rs.";
  const balance = party.current_balance ?? 0;
  const defaultDirection =
    party.party_type === "supplier" ? "paid" : "received";

  return (
    <div>
      <PageHeader title={party.name} description={`${party.party_type} · ${party.phone || "No phone"}`}>
        <Link href={`/parties/${id}/edit`}><Button variant="outline">Edit</Button></Link>
        <Link href="/parties"><Button variant="outline">Back</Button></Link>
      </PageHeader>

      <Card className="mb-6 max-w-sm">
        <CardTitle>Current Balance</CardTitle>
        <CardValue className={balance > 0 ? "text-warning" : ""}>
          {formatCurrency(balance, currency)}
        </CardValue>
        <p className="mt-1 text-xs text-muted">
          {party.party_type === "supplier"
            ? balance > 0 ? "You owe this supplier" : "No outstanding payable"
            : balance > 0 ? "Customer owes you" : "No outstanding receivable"}
        </p>
      </Card>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold">Record Payment</h3>
          <PaymentForm
            partyId={id}
            defaultDirection={defaultDirection as "received" | "paid"}
            accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
          />
        </Card>
        {party.address && (
          <Card>
            <h3 className="mb-2 font-semibold">Address</h3>
            <p className="text-sm">{party.address}</p>
            {party.notes && <p className="mt-3 text-sm text-muted">{party.notes}</p>}
          </Card>
        )}
      </div>

      <h3 className="mb-3 text-lg font-semibold">Ledger (Khata)</h3>
      <DataTable>
        <DataTableHead>
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Balance</th>
            <th className="px-4 py-3">Notes</th>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {ledger.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-3">{formatDate(e.entry_date)}</td>
              <td className="px-4 py-3">{ENTRY_LABELS[e.entry_type] || e.entry_type}</td>
              <td className="px-4 py-3">{formatCurrency(e.amount, currency)}</td>
              <td className="px-4 py-3 font-medium">{formatCurrency(e.balance_after, currency)}</td>
              <td className="px-4 py-3 text-muted">{e.notes || "—"}</td>
            </tr>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
