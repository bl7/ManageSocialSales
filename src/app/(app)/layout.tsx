import { getSettings } from "@/lib/queries/dashboard";
import { Sidebar } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const businessName = settings?.business_name ?? "Shree Inventory";

  return (
    <div className="min-h-screen">
      <Sidebar businessName={businessName} />
      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6">{children}</div>
      </main>
    </div>
  );
}
