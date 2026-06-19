"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGeminiClient, DailySummaryResult, getFallbackDailySummary } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

export async function getRecentSummaries() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data } = await supabase
      .from("daily_summaries")
      .select("*")
      .eq("merchant_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(7);

    return data || [];
  } catch (error) {
    console.error("Error fetching recent summaries:", error);
    return [];
  }
}

export async function generateDailySummary(): Promise<{ summary: DailySummaryResult | null; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { summary: getFallbackDailySummary({ totalSalesToday: 0, newCustomersToday: 0, totalDues: 0, lowStockCount: 0 }), error: "Unauthorized" };
    }

    // 1. Fetch data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [
      { data: purchasesToday },
      { data: customersToday },
      { data: customersAll },
      { data: inventory }
    ] = await Promise.all([
      supabase.from("purchases").select("amount, product_name, quantity").eq("merchant_id", user.id).gte("purchase_date", todayIso),
      supabase.from("customers").select("id").eq("merchant_id", user.id).gte("created_at", todayIso),
      supabase.from("customers").select("pending_amount").eq("merchant_id", user.id),
      supabase.from("products").select("quantity, minimum_stock_threshold").eq("merchant_id", user.id)
    ]);

    const safePurchasesToday = purchasesToday || [];
    const safeCustomersToday = customersToday || [];
    const safeCustomersAll = customersAll || [];
    const safeInventory = inventory || [];

    // 2. Aggregate metrics
    const totalSalesToday = safePurchasesToday.reduce((sum, p) => sum + Number(p.amount), 0);
    const newCustomersToday = safeCustomersToday.length;
    const totalDues = safeCustomersAll.reduce((sum, c) => sum + Number(c.pending_amount || 0), 0);
    const lowStockCount = safeInventory.filter(p => Number(p.quantity) <= Number(p.minimum_stock_threshold)).length;

    const fallbackData = { totalSalesToday, newCustomersToday, totalDues, lowStockCount };
    const baseSummary = getFallbackDailySummary(fallbackData);

    const businessContext = `
      Daily Summary Data:
      - Total Sales Today: ₹${totalSalesToday}
      - New Customers Today: ${newCustomersToday}
      - Total Pending Dues (Khata): ₹${totalDues}
      - Low Stock Products: ${lowStockCount} items
    `;

    const aiClient = getGeminiClient();

    let finalSummary = baseSummary;

    if (!aiClient) {
      console.log("No Gemini client, using fallback summary.");
    } else {
      // Ask Gemini to generate summary
      const prompt = `
        You are an AI business advisor for a local retail merchant. 
        Write a very concise (2-3 sentences) daily summary text, generate a business health score (0-100), and provide exactly 3 quick highlights.
        
        Guidelines:
        - Keep the tone encouraging but professional.
        - The highlights must be short bullet-point style texts. Each highlight must have a 'type' of either "success", "warning", or "info".
        - Do not use technical jargon. Format the response as a clean JSON object.
        
        Example structure: 
        { 
          "summaryText": "You had a great day...", 
          "healthScore": 85, 
          "highlights": [
            { "type": "success", "text": "₹5,000 in sales today" },
            { "type": "warning", "text": "3 items low on stock" }
          ] 
        }

        ${businessContext}
      `;

      try {
        const response = await aiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const responseText = response.text || "{}";
        const parsed = JSON.parse(responseText);
        
        if (parsed.summaryText && typeof parsed.healthScore === 'number' && Array.isArray(parsed.highlights)) {
          finalSummary = {
            summaryText: parsed.summaryText,
            healthScore: parsed.healthScore,
            highlights: parsed.highlights.slice(0, 4)
          };
        }
      } catch (e) {
        console.error("Failed to parse AI daily summary:", e);
        // Fallback is already set
      }
    }

    // Save to database
    const { error: insertError } = await supabase.from("daily_summaries").insert({
      merchant_id: user.id,
      summary_text: finalSummary.summaryText,
      health_score: finalSummary.healthScore,
      highlights: finalSummary.highlights,
    });

    if (insertError) {
      console.error("Failed to save daily summary to database:", insertError);
    }

    revalidatePath("/(dashboard)", "page");
    
    return { summary: finalSummary };
  } catch (error: any) {
    console.error("Error generating daily summary:", error);
    return { summary: getFallbackDailySummary({ totalSalesToday: 0, newCustomersToday: 0, totalDues: 0, lowStockCount: 0 }), error: error.message };
  }
}
