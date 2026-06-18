"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function addCustomer(data: { name: string, phone: string, address?: string }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: inserted, error } = await supabase
    .from('customers')
    .insert([{ ...data, merchant_id: user.id }])
    .select('id')
    .single()

  if (error) {
    console.error("Error adding customer", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/customers')
  return { success: true, id: inserted.id };
}

export async function updateCustomer(id: string, data: { name: string, phone: string, address?: string }) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('customers').update(data).eq('id', id)
  if (error) {
    console.error("Error updating customer", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/customers')
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) {
    console.error("Error deleting customer", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/customers')
  return { success: true };
}
