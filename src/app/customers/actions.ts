"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function addCustomer(data: { name: string, phone: string, address?: string }) {
  const { data: inserted, error } = await supabase.from('customers').insert([data]).select('id').single()
  if (error) {
    console.error("Error adding customer", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/customers')
  return { success: true, id: inserted.id };
}

export async function updateCustomer(id: string, data: { name: string, phone: string, address?: string }) {
  const { error } = await supabase.from('customers').update(data).eq('id', id)
  if (error) {
    console.error("Error updating customer", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/customers')
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) {
    console.error("Error deleting customer", error);
    return { success: false, error: error.message };
  }
  revalidatePath('/customers')
  return { success: true };
}
