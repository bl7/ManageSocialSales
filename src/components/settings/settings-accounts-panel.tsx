import Link from "next/link";
import { getAccounts } from "@/lib/queries/accounts";
import { getSettings } from "@/lib/queries/dashboard";
import { EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";

export async function SettingsAccountsPanel() {
  const [accounts, settings] = await Promise.all([getAccounts(), getSettings()]);
  const currency = settings?.currency ?? "Rs.";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Accounts</h3>
        <Link href="/settings/accounts/new"><Button size="sm">Add Account</Button></Link>
      </div>
      {accounts.length === 0 ? (
        <EmptyState message="No accounts yet." actionLabel="Add Account" actionHref="/settings/accounts/new" />
      ) : (
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3"></th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {accounts.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3 capitalize">{a.account_type}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(a.current_balance ?? 0, currency)}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/settings/accounts/${a.id}/edit`} className="text-sm text-primary hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
