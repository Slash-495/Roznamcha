"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function addPurchase(data: { customer_id: string, product_name: string, quantity: number, amount: number, purchase_date: string }[]) {
  const { error } = await supabase.from('purchases').insert(data)
  if (error) {
    console.error("Error adding purchase", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/purchases')
  return { success: true };
}

export async function updatePurchase(id: string, data: { product_name: string, quantity: number, amount: number, purchase_date: string }) {
  const { error } = await supabase.from('purchases').update(data).eq('id', id)
  if (error) {
    console.error("Error updating purchase", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/purchases')
  return { success: true };
}

export async function deletePurchase(id: string) {
  const { error } = await supabase.from('purchases').delete().eq('id', id)
  if (error) {
    console.error("Error deleting purchase", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/purchases')
  return { success: true };
}
