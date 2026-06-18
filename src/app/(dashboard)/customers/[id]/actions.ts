"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function addKhataCredit(customerId: string, formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const note = formData.get("note")?.toString() || null;

    if (amount <= 0) {
      return { error: "Amount must be greater than zero." };
    }

    // 1. Fetch current customer pending amount
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("pending_amount")
      .eq("id", customerId)
      .eq("merchant_id", user.id)
      .single();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }
    if (!customer) throw new Error("Customer not found.");

    const newPendingAmount = Number(customer.pending_amount || 0) + amount;
    const now = new Date().toISOString();

    // 2. Insert Transaction
    const { error: txError } = await supabase.from("khata_transactions").insert([{
      merchant_id: user.id,
      customer_id: customerId,
      transaction_type: "credit",
      amount,
      note,
      created_at: now
    }]);

    if (txError) throw txError;

    // 3. Update Customer
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        pending_amount: newPendingAmount,
        last_transaction_date: now
      })
      .eq("id", customerId)
      .eq("merchant_id", user.id);

    if (updateError) throw updateError;

    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/customers");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error adding credit:", error);
    return { error: error.message || "Failed to add credit." };
  }
}

export async function recoverKhataPayment(customerId: string, formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const note = formData.get("note")?.toString() || null;

    if (amount <= 0) {
      return { error: "Amount must be greater than zero." };
    }

    // 1. Fetch current customer pending amount
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("pending_amount")
      .eq("id", customerId)
      .eq("merchant_id", user.id)
      .single();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }
    if (!customer) throw new Error("Customer not found.");

    const newPendingAmount = Number(customer.pending_amount || 0) - amount;

    if (newPendingAmount < 0) {
      return { error: "Cannot recover more than the pending amount." };
    }

    const now = new Date().toISOString();

    // 2. Insert Transaction
    const { error: txError } = await supabase.from("khata_transactions").insert([{
      merchant_id: user.id,
      customer_id: customerId,
      transaction_type: "recovery",
      amount,
      note,
      created_at: now
    }]);

    if (txError) throw txError;

    // 3. Update Customer
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        pending_amount: newPendingAmount,
        last_transaction_date: now
      })
      .eq("id", customerId)
      .eq("merchant_id", user.id);

    if (updateError) throw updateError;

    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/customers");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error recovering payment:", error);
    return { error: error.message || "Failed to recover payment." };
  }
}
