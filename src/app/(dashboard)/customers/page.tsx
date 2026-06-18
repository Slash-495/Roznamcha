import { CustomerTable } from "./components/CustomerTable";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .eq("merchant_id", user?.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
        <p className="text-muted-foreground">Manage your customer directory here.</p>
      </div>

      <CustomerTable initialCustomers={customers || []} />
    </div>
  );
}
