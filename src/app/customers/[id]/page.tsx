import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CustomerDetailsClient } from "./CustomerDetailsClient";

export const dynamic = "force-dynamic";

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (customerError || !customer) {
    notFound();
  }

  const { data: purchases, error: purchasesError } = await supabase
    .from("purchases")
    .select("*")
    .eq("customer_id", id)
    .order("purchase_date", { ascending: false });

  if (purchasesError) {
    console.error("Error fetching purchases:", purchasesError);
  }

  const safePurchases = purchases || [];

  return (
    <CustomerDetailsClient
      customer={customer}
      purchases={safePurchases}
    />
  );
}
