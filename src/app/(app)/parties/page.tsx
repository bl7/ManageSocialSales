import Link from "next/link";
import { getParties } from "@/lib/queries/parties";
import { getSettings } from "@/lib/queries/dashboard";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ type?: string; search?: string }>;
}

export default async function PartiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const [parties, settings] = await Promise.all([
    getParties({ type: params.type, search: params.search }),
    getSettings(),
  ]);
  const currency = settings?.currency ?? "Rs.";

  return (
    <div>
      <PageHeader title="Parties" description="Customers and suppliers (udhar khata)">
        <Link href="/parties/new"><Button>Add Party</Button></Link>
      </PageHeader>

      <form className="mb-6 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <input name="search" placeholder="Search name, phone..." defaultValue={params.search}
          className="h-10 flex-1 rounded-lg border border-border px-3 text-sm min-w-[200px]" />
        <select name="type" defaultValue={params.type || "all"}
          className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="all">All types</option>
          <option value="customer">Customers</option>
          <option value="supplier">Suppliers</option>
        </select>
        <Button type="submit">Filter</Button>
      </form>

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
                  {(p.current_balance ?? 0) > 0 && (
                    <span className="ml-1 text-xs text-muted">
                      {p.party_type === "supplier" ? "payable" : "receivable"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/parties/${p.id}`} className="text-sm text-primary hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
