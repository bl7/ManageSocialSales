import Link from "next/link";
import { getSalePaymentMethods } from "@/lib/queries/payment-methods";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableHead, DataTableBody } from "@/components/ui/data-table";

export default async function PaymentMethodsPage() {
  const methods = await getSalePaymentMethods();

  return (
    <div>
      <PageHeader title="Payment Methods" description="Sale payment options (Cash, COD, etc.)">
        <Link href="/payment-methods/new"><Button>Add Method</Button></Link>
      </PageHeader>

      {methods.length === 0 ? (
        <EmptyState message="No payment methods yet." actionLabel="Add Method" actionHref="/payment-methods/new" />
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
                  <Link href={`/payment-methods/${m.id}/edit`} className="text-sm text-primary hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
