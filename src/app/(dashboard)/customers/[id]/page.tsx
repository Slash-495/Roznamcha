import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { CustomerDetailsClient } from "./CustomerDetailsClient";

export const dynamic = "force-dynamic";

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("merchant_id", user?.id)
    .single();

  if (customerError || !customer) {
    notFound();
  }

  const { data: purchases, error: purchasesError } = await supabase
    .from("purchases")
    .select("*")
    .eq("customer_id", id)
    .eq("merchant_id", user?.id)
    .order("purchase_date", { ascending: false });

  if (purchasesError) {
    console.error("Error fetching purchases:", purchasesError);
  }

  const { data: khataTransactions, error: khataError } = await supabase
    .from("khata_transactions")
    .select("*")
    .eq("customer_id", id)
    .eq("merchant_id", user?.id)
    .order("created_at", { ascending: false });

  if (khataError) {
    console.error("Error fetching khata transactions:", khataError);
  }

  const safePurchases = purchases || [];
  const safeKhata = khataTransactions || [];

  return (
    <CustomerDetailsClient
      customer={customer}
      purchases={safePurchases}
      khataTransactions={safeKhata}
    />
  );
}
