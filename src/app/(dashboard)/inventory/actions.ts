"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function addProduct(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be logged in to add a product." };
    }

    const name = formData.get("name")?.toString();
    const category = formData.get("category")?.toString();
    const quantity = parseInt(formData.get("quantity")?.toString() || "0", 10);
    const unit_price = parseFloat(formData.get("unit_price")?.toString() || "0");
    const minimum_stock_threshold = parseInt(formData.get("minimum_stock_threshold")?.toString() || "0", 10);

    if (!name || !category) {
      return { error: "Product Name and Category are required." };
    }

    const { error } = await supabase.from("products").insert([{
      merchant_id: user.id,
      name,
      category,
      quantity,
      unit_price,
      minimum_stock_threshold,
    }]);

    if (error) throw error;

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding product:", error);
    return { error: error.message || "Failed to add product." };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be logged in to update a product." };
    }

    const name = formData.get("name")?.toString();
    const category = formData.get("category")?.toString();
    const quantity = parseInt(formData.get("quantity")?.toString() || "0", 10);
    const unit_price = parseFloat(formData.get("unit_price")?.toString() || "0");
    const minimum_stock_threshold = parseInt(formData.get("minimum_stock_threshold")?.toString() || "0", 10);

    if (!name || !category) {
      return { error: "Product Name and Category are required." };
    }

    const { error } = await supabase
      .from("products")
      .update({
        name,
        category,
        quantity,
        unit_price,
        minimum_stock_threshold,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("merchant_id", user.id); // Extra security

    if (error) throw error;

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return { error: error.message || "Failed to update product." };
  }
}

export async function deleteProduct(id: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("merchant_id", user.id);

    if (error) throw error;

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return { error: error.message || "Failed to delete product." };
  }
}

export async function updateStock(id: string, currentQuantity: number, delta: number) {
  try {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 0) {
      return { error: "Stock cannot be negative." };
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("products")
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("merchant_id", user.id);

    if (error) throw error;

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating stock:", error);
    return { error: error.message || "Failed to update stock." };
  }
}
