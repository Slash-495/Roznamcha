"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function updateMerchantProfile(prevState: any, formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be logged in to update your profile." };
    }

    const shop_name = formData.get("shop_name")?.toString();
    const owner_name = formData.get("owner_name")?.toString();
    const phone_number = formData.get("phone_number")?.toString() || null;
    const shop_address = formData.get("shop_address")?.toString() || null;
    const business_category = formData.get("business_category")?.toString() || null;

    if (!shop_name || !owner_name) {
      return { error: "Shop Name and Owner Name are required." };
    }

    const { error } = await supabase
      .from("merchants")
      .update({
        shop_name,
        owner_name,
        phone_number,
        shop_address,
        business_category,
      })
      .eq("id", user.id);

    if (error) throw error;

    revalidatePath("/settings");
    revalidatePath("/");
    
    return { success: "Profile updated successfully!" };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}
