import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { StatCard } from "../components/dashboard/StatCard";
import { InventoryClient } from "./components/InventoryClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch products
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("merchant_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load inventory. Please try refreshing.
      </div>
    );
  }

  const safeProducts = products || [];

  // Calculate statistics
  const totalProducts = safeProducts.length;
  const totalUnits = safeProducts.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockCount = safeProducts.filter(p => p.quantity <= p.minimum_stock_threshold).length;
  const totalValue = safeProducts.reduce((sum, p) => sum + (p.quantity * Number(p.unit_price)), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground">Manage your products and stock levels.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={totalProducts} />
        <StatCard title="Total Units in Stock" value={totalUnits} />
        <StatCard title="Low Stock Products" value={lowStockCount} />
        <StatCard 
          title="Total Inventory Value" 
          value={totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
          prefix="₹" 
        />
      </div>

      <InventoryClient initialProducts={safeProducts} />
    </div>
  );
}
