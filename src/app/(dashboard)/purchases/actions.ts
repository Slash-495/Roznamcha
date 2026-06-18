"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function addPurchase(data: { customer_id: string, product_name: string, quantity: number, amount: number, purchase_date: string }[]) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const rows = data.map(item => ({ ...item, merchant_id: user.id }))

  const { error } = await supabase.from('purchases').insert(rows)
  if (error) {
    console.error("Error adding purchase", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/purchases')
  return { success: true };
}

export async function updatePurchase(id: string, data: { product_name: string, quantity: number, amount: number, purchase_date: string }) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('purchases').update(data).eq('id', id)
  if (error) {
    console.error("Error updating purchase", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/purchases')
  return { success: true };
}

export async function deletePurchase(id: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('purchases').delete().eq('id', id)
  if (error) {
    console.error("Error deleting purchase", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/purchases')
  return { success: true };
}
