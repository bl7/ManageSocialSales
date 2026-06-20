import Link from "next/link";
import { Suspense } from "react";
import {
  getParties,
  getTotalReceivables,
  getTotalPayables,
  getOutstandingReceivables,
  getOutstandingPayables,
} from "@/lib/queries/parties";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader, EmptyState, ListPage, ListFilterBar, SummaryGrid } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { PartiesTabs } from "@/components/parties/parties-tabs";
import { formatCurrency } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ type?: string; search?: string; tab?: string }>;
}

export default async function PartiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab === "to-collect" || params.tab === "to-pay" ? params.tab : "all";

  const [parties, toCollect, toPay, receivables, payables, settings] = await Promise.all([
    tab === "all" ? getParties({ type: params.type, search: params.search }) : Promise.resolve([]),
    getTotalReceivables(),
    getTotalPayables(),
    tab === "to-collect" ? getOutstandingReceivables() : Promise.resolve([]),
    tab === "to-pay" ? getOutstandingPayables() : Promise.resolve([]),
    getSettings(),
  ]);

  const currency = settings?.currency ?? "Rs.";
  const netPosition = toCollect - toPay;

  return (
    <ListPage>
      <PageHeader title="Parties" description="Customers, suppliers, and credit (udhar)">
        <Link href="/parties/new"><Button>Add Party</Button></Link>
      </PageHeader>

      <SummaryGrid cols={3}>
        <Card className="border-primary/30 bg-gradient-to-br from-teal-50/80 to-white">
          <CardTitle>To Collect</CardTitle>
          <CardValue className="text-primary">{formatCurrency(toCollect, currency)}</CardValue>
        </Card>
        <Card className="border-warning/30 bg-gradient-to-br from-amber-50/80 to-white">
          <CardTitle>To Pay</CardTitle>
          <CardValue className="text-warning">{formatCurrency(toPay, currency)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Net Position</CardTitle>
          <CardValue className={netPosition >= 0 ? "text-success" : "text-danger"}>
            {formatCurrency(netPosition, currency)}
          </CardValue>
        </Card>
      </SummaryGrid>

      <Suspense fallback={null}>
        <PartiesTabs active={tab} />
      </Suspense>

      {tab === "all" && (
        <>
          <ListFilterBar>
            <form className="flex flex-wrap gap-3">
              <input name="search" placeholder="Search name, phone..." defaultValue={params.search}
                className="h-11 min-w-[200px] flex-1 rounded-xl border border-border px-3 text-sm" />
              <select name="type" defaultValue={params.type || "all"} className="h-11 rounded-xl border border-border px-3 text-sm">
                <option value="all">All types</option>
                <option value="customer">Customers</option>
                <option value="supplier">Suppliers</option>
              </select>
              <Button type="submit">Filter</Button>
            </form>
          </ListFilterBar>

          {parties.length === 0 ? (
            <EmptyState message="No parties yet." actionLabel="Add Party" actionHref="/parties/new" />
          ) : (
            <DataTable>
              <DataTableHead>
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {parties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 capitalize">{p.party_type}</td>
                    <td className="px-4 py-3">{p.phone || "—"}</td>
                    <td className={`px-4 py-3 font-medium ${(p.current_balance ?? 0) > 0 ? "text-warning" : ""}`}>
                      {formatCurrency(p.current_balance ?? 0, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/parties/${p.id}`} className="text-sm text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </>
      )}

      {tab === "to-collect" && (
        receivables.length === 0 ? (
          <EmptyState message="No outstanding customer balances." />
        ) : (
          <DataTable>
            <DataTableHead>
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {receivables.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-primary">{formatCurrency(p.current_balance, currency)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/parties/${p.id}`} className="text-sm text-primary hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
        )
      )}

      {tab === "to-pay" && (
        payables.length === 0 ? (
          <EmptyState message="No outstanding supplier balances." />
        ) : (
          <DataTable>
            <DataTableHead>
              <tr>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {payables.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-warning">{formatCurrency(p.current_balance, currency)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/parties/${p.id}`} className="text-sm text-primary hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
        )
      )}
    </ListPage>
  );
}
