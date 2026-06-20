import Link from "next/link";
import { getSalePaymentMethods } from "@/lib/queries/payment-methods";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";

export async function SettingsPaymentMethodsPanel() {
  const methods = await getSalePaymentMethods();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Payment Methods</h3>
        <Link href="/settings/payment-methods/new"><Button size="sm">Add Method</Button></Link>
      </div>
      {methods.length === 0 ? (
        <EmptyState message="No payment methods yet." actionLabel="Add Method" actionHref="/settings/payment-methods/new" />
      ) : (
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3"></th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {methods.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3">
                  <Link href={`/settings/payment-methods/${m.id}/edit`} className="text-sm text-primary hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
