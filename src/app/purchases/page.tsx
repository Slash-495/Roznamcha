import { supabase } from "@/lib/supabase";
import { PurchaseTable } from "./components/PurchaseTable";

export const dynamic = "force-dynamic";

export default async function PurchasesPage(props: { searchParams?: Promise<{ filter?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams?.filter || "all";

  let query = supabase
    .from("purchases")
    .select("*, customers(name, phone)")
    .order("purchase_date", { ascending: false });

  if (filter !== "all") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);

    if (filter === "daily") {
      startDate = new Date(today);
    } else if (filter === "weekly") {
      startDate.setDate(today.getDate() - 7);
    } else if (filter === "monthly") {
      startDate.setMonth(today.getMonth() - 1);
    } else if (filter === "yearly") {
      startDate.setFullYear(today.getFullYear() - 1);
    }

    const isoDate = startDate.toISOString().split("T")[0];
    query = query.gte("purchase_date", isoDate);
  }

  const { data: purchases, error: purchasesError } = await query;

  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select("id, name, phone")
    .order("name", { ascending: true });

  if (purchasesError) console.error("Error fetching purchases:", purchasesError);
  if (customersError) console.error("Error fetching customers:", customersError);

  const totalPurchases = purchases?.length || 0;
  const totalRevenue = purchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Purchases</h2>
        <p className="text-muted-foreground">Record and manage customer purchases.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Purchases</h3>
          </div>
          <div className="text-2xl font-bold">{totalPurchases}</div>
        </div>
        <div className="rounded-xl border bg-white text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Revenue</h3>
          </div>
          <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <PurchaseTable initialPurchases={purchases || []} customers={customers || []} currentFilter={filter} />
    </div>
  );
}
