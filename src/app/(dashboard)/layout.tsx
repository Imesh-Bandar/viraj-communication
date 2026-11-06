import { redirect } from "next/navigation";
import { ShopProvider } from "@/components/ShopContext";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { shopName, currency } = await getSettings();

  return (
    <ShopProvider value={{ user, shopName, currency }}>
      <Sidebar />
      <main className="min-h-screen p-4 pb-28 sm:p-8 sm:pb-28 lg:pb-8 lg:ml-60 print:ml-0"><div className="mx-auto max-w-7xl">{children}</div></main>
    </ShopProvider>
  );
}
