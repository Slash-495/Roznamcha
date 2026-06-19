"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGeminiClient, StockAlert, getFallbackStockAlerts } from "@/lib/gemini";

export async function generateStockAlerts(): Promise<{ score: number; alerts: StockAlert[]; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { ...getFallbackStockAlerts({ critical: [], warning: [], fast: [], slow: [] }), error: "Unauthorized" };
    }

    // 1. Fetch raw inventory and purchase data
    const [
      { data: inventory },
      { data: purchases }
    ] = await Promise.all([
      supabase.from("products").select("*").eq("merchant_id", user.id),
      // Fetch purchases from the last 45 days to calculate velocity
      supabase.from("purchases").select("product_name, quantity, purchase_date").eq("merchant_id", user.id).gte('purchase_date', new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    const safeInventory = inventory || [];
    const safePurchases = purchases || [];

    // 2. Aggregate Data
    const critical: string[] = [];
    const warning: string[] = [];
    const productSalesMap = new Map<string, number>();

    safePurchases.forEach(p => {
      productSalesMap.set(p.product_name, (productSalesMap.get(p.product_name) || 0) + Number(p.quantity));
    });

    // Identify slow moving products (in inventory but not sold recently)
    const slow: string[] = [];
    
    safeInventory.forEach(product => {
      const qty = Number(product.quantity);
      const minStock = Number(product.minimum_stock_threshold);
      
      if (qty === 0) {
        critical.push(product.name);
      } else if (qty <= minStock) {
        warning.push(product.name);
      }

      if (!productSalesMap.has(product.name) && qty > 0) {
        slow.push(product.name);
      }
    });

    // Identify fast moving products
    const fast = Array.from(productSalesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(p => p[0]);

    const fallbackData = { critical, warning, fast, slow };
    const baseScoreAndAlerts = getFallbackStockAlerts(fallbackData);

    const businessContext = `
      Inventory Summary:
      - Total Distinct Products: ${safeInventory.length}
      - Critical (Out of Stock): ${critical.length} (${critical.join(", ") || "None"})
      - Warning (Low Stock): ${warning.length} (${warning.join(", ") || "None"})
      - Fast Moving Products (High Sales): ${fast.join(", ") || "None"}
      - Slow Moving Products (No Sales in 45 days): ${slow.join(", ") || "None"}
    `;

    const aiClient = getGeminiClient();

    // 3. Fallback if no AI Key
    if (!aiClient) {
      return { ...baseScoreAndAlerts, error: "GEMINI_API_KEY is not configured." };
    }

    // 4. Ask Gemini to generate stock alerts
    const prompt = `
      You are an AI inventory manager for a local retail merchant.
      Analyze the following inventory data and generate exactly 4 concise, practical, and actionable stock alerts.
      
      CRITICAL INSTRUCTIONS FOR ALERTS:
      1. Always explicitly mention the product names in your recommendations.
      2. Categorize each alert strictly as 'critical', 'warning', 'fast_moving', or 'slow_moving'.
      3. Critical means completely out of stock. Warning means low stock. Fast moving means selling rapidly. Slow moving means not selling.
      4. Keep the 'recommendation' field short and direct.
      
      Do not use technical jargon. Format the response as a clean JSON array of objects.
      Example structure: [{ "id": "1", "type": "warning", "productName": "Pressure Cookers", "recommendation": "Restock immediately, below minimum threshold." }]

      ${businessContext}
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text || "[]";
    let alerts: StockAlert[] = [];
    
    try {
      alerts = JSON.parse(responseText);
      if (!Array.isArray(alerts)) throw new Error("Not an array");
      alerts = alerts.slice(0, 4).map((a, idx) => ({
        id: a.id || `ai_stock_${idx}`,
        type: (["critical", "warning", "fast_moving", "slow_moving"].includes(a.type) ? a.type : "warning") as any,
        productName: a.productName || "Unknown Product",
        recommendation: a.recommendation || "Review stock levels."
      }));
    } catch (e) {
      console.error("Failed to parse AI stock response:", responseText);
      return { ...baseScoreAndAlerts, error: "Failed to parse AI alerts." };
    }

    return { score: baseScoreAndAlerts.score, alerts };
  } catch (error: any) {
    console.error("Error generating stock alerts:", error);
    return { ...getFallbackStockAlerts({ critical: [], warning: [], fast: [], slow: [] }), error: error.message };
  }
}
