import { createSupabaseServerClient } from "@/lib/supabase-server";
import { StatCard } from "./components/dashboard/StatCard";
import { RevenueChart } from "./components/dashboard/RevenueChart";
import { RecentPurchases } from "./components/dashboard/RecentPurchases";
import { TopList } from "./components/dashboard/TopList";
import { ActivityFeed, ActivityEvent } from "./components/dashboard/ActivityFeed";
import { AiInsightsWidget } from "./components/dashboard/AiInsightsWidget";
import { AiStockAlertsWidget } from "./components/dashboard/AiStockAlertsWidget";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: customers } = await supabase.from("customers").select("*").eq("merchant_id", user?.id);
  const { data: purchases } = await supabase.from("purchases").select("*, customers(name, phone)").eq("merchant_id", user?.id).order("purchase_date", { ascending: false });
  const { data: khataTransactions } = await supabase.from("khata_transactions").select("*").eq("merchant_id", user?.id);

  const safeCustomers = customers || [];
  const safePurchases = purchases || [];
  const safeKhata = khataTransactions || [];

  // 1. Overview Stats
  const totalCustomers = safeCustomers.length;
  const totalPurchases = safePurchases.length;
  const totalRevenue = safePurchases.reduce((sum, p) => sum + Number(p.amount), 0);
  const avgOrderValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

  // 2. Khata Stats
  const totalOutstanding = safeCustomers.reduce((sum, c) => sum + Number(c.pending_amount || 0), 0);
  const pendingCustomersCount = safeCustomers.filter(c => Number(c.pending_amount || 0) > 0).length;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthKhata = safeKhata.filter(t => {
    const d = new Date(t.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const recoveredThisMonth = thisMonthKhata
    .filter(t => t.transaction_type === "recovery")
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const creditThisMonth = thisMonthKhata
    .filter(t => t.transaction_type === "credit")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 3. Recent Purchases
  const recentPurchases = safePurchases.slice(0, 5);

  // 4. Top Customers
  const customerSpendMap = new Map<string, { name: string; total: number; orders: number }>();
  safePurchases.forEach(p => {
    const id = p.customer_id;
    const amount = Number(p.amount);
    if (!customerSpendMap.has(id)) {
      customerSpendMap.set(id, { name: p.customers?.name || "Unknown", total: 0, orders: 0 });
    }
    const entry = customerSpendMap.get(id)!;
    entry.total += amount;
    entry.orders += 1;
  });
  const topCustomers = Array.from(customerSpendMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(c => ({ name: c.name, sub: `${c.orders} orders`, value: c.total }));

  // 5. Most Sold Products
  const productSalesMap = new Map<string, number>();
  safePurchases.forEach(p => {
    const current = productSalesMap.get(p.product_name) || 0;
    productSalesMap.set(p.product_name, current + Number(p.quantity));
  });
  const topProducts = Array.from(productSalesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(p => ({ name: p[0], value: p[1] }));

  // 6. Revenue Trend (Last 6 Months)
  const revenueMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    revenueMap.set(format(d, "MMM yyyy"), 0);
  }
  safePurchases.forEach(p => {
    const month = format(new Date(p.purchase_date), "MMM yyyy");
    if (revenueMap.has(month)) {
      revenueMap.set(month, revenueMap.get(month)! + Number(p.amount));
    }
  });
  const revenueData = Array.from(revenueMap.entries()).map(([month, revenue]) => ({ month, revenue }));

  // 7. Recent Activity
  const activities: ActivityEvent[] = [
    ...safeCustomers.map(c => ({
      id: `c_${c.id}`,
      type: "customer_added" as const,
      title: "New Customer",
      description: `${c.name} was added.`,
      date: new Date(c.created_at)
    })),
    ...safePurchases.map(p => ({
      id: `p_${p.id}`,
      type: "purchase_recorded" as const,
      title: "Purchase Recorded",
      description: `₹${Number(p.amount).toLocaleString()} purchase by ${p.customers?.name || "Unknown"}.`,
      date: new Date(p.created_at)
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your shop's performance and Khata.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Customers" value={totalCustomers} />
        <StatCard title="Total Purchases" value={totalPurchases} />
        <StatCard title="Total Revenue" value={totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="₹" />
        <StatCard title="Avg Order Value" value={avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="₹" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Outstanding" value={totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="₹" />
        <StatCard title="Pending Customers" value={pendingCustomersCount} />
        <StatCard title="Recovered This Month" value={recoveredThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="₹" />
        <StatCard title="Credit This Month" value={creditThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="₹" />
      </div>

      <div className="grid gap-6 lg:grid-cols-7 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-3 space-y-6">
          <AiInsightsWidget />
          <AiStockAlertsWidget />
          <div className="rounded-xl border bg-white shadow-sm p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <ActivityFeed events={activities} />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border bg-white shadow-sm p-6">
            <h3 className="font-semibold mb-4">Revenue Trend (Last 6 Months)</h3>
            <RevenueChart data={revenueData} />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 items-start">
            <div className="rounded-xl border bg-white shadow-sm p-6">
              <h3 className="font-semibold mb-4">Recent Purchases</h3>
              <RecentPurchases purchases={recentPurchases} />
            </div>
            
            <div className="space-y-6">
              <div className="rounded-xl border bg-white shadow-sm p-6">
                <h3 className="font-semibold mb-4">Top Customers</h3>
                <TopList items={topCustomers} emptyMessage="No customers yet." valuePrefix="₹" />
              </div>
              
              <div className="rounded-xl border bg-white shadow-sm p-6">
                <h3 className="font-semibold mb-4">Most Sold Products</h3>
                <TopList items={topProducts} emptyMessage="No purchases yet." />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
