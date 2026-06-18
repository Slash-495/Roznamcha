"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGeminiClient, Insight, getFallbackInsights } from "@/lib/gemini";

export async function generateBusinessInsights(): Promise<{ insights: Insight[], error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { insights: getFallbackInsights({ topCustomers: [], totalDues: 0, lowStock: [], totalRevenue: 0 }), error: "Unauthorized" };
    }

    // 1. Fetch raw data strictly for this merchant
    const [
      { data: customers },
      { data: purchases },
      { data: khata },
      { data: inventory }
    ] = await Promise.all([
      supabase.from("customers").select("id, name, pending_amount, created_at").eq("merchant_id", user.id),
      supabase.from("purchases").select("id, amount, product_name, quantity, purchase_date").eq("merchant_id", user.id).order("purchase_date", { ascending: false }).limit(100),
      supabase.from("khata_transactions").select("id, transaction_type, amount, created_at").eq("merchant_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("products").select("id, name, quantity, minimum_stock_threshold").eq("merchant_id", user.id)
    ]);

    const safeCustomers = customers || [];
    const safePurchases = purchases || [];
    const safeKhata = khata || [];
    const safeInventory = inventory || [];

    // 2. Summarize data to avoid sending too much text to the AI
    
    // Revenue Summaries
    const totalCustomers = safeCustomers.length;
    const totalPurchases = safePurchases.length;
    const totalRevenue = safePurchases.reduce((sum, p) => sum + Number(p.amount), 0);
    
    const productSalesMap = new Map<string, number>();
    safePurchases.forEach(p => {
      productSalesMap.set(p.product_name, (productSalesMap.get(p.product_name) || 0) + Number(p.quantity));
    });
    const topProducts = Array.from(productSalesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(p => `${p[0]} (${p[1]} sold)`);

    // Khata Summaries
    const customersWithDues = safeCustomers
      .filter(c => Number(c.pending_amount || 0) > 0)
      .sort((a, b) => Number(b.pending_amount) - Number(a.pending_amount));
      
    const topPendingCustomers = customersWithDues.slice(0, 3).map(c => `${c.name} (₹${c.pending_amount})`);
    const totalPendingAmount = customersWithDues.reduce((sum, c) => sum + Number(c.pending_amount), 0);
    
    const recentRecoveries = safeKhata
      .filter(k => k.transaction_type === "recovery")
      .reduce((sum, k) => sum + Number(k.amount), 0);

    // Inventory Summaries
    const lowStockProducts = safeInventory
      .filter(p => Number(p.quantity) <= Number(p.minimum_stock_threshold))
      .map(p => p.name);

    // Dynamic fallback payload
    const fallbackData = {
      topCustomers: topPendingCustomers,
      totalDues: totalPendingAmount,
      lowStock: lowStockProducts,
      totalRevenue: totalRevenue
    };

    // 3. Construct Context for AI
    const businessContext = `
      Merchant Data Summary:
      - Total Customers: ${totalCustomers}
      - Customers with Pending Dues: ${customersWithDues.length} (Total Dues: ₹${totalPendingAmount})
      - Top Customers with Dues: ${topPendingCustomers.join(", ") || "None"}
      - Recent Payments Recovered: ₹${recentRecoveries}
      - Total Revenue (Recent): ₹${totalRevenue} from ${totalPurchases} purchases.
      - Top Selling Products: ${topProducts.join(", ") || "None yet"}
      - Low Stock Products (Needs Restocking): ${lowStockProducts.join(", ") || "None"}
    `;

    const aiClient = getGeminiClient();

    // 4. Fallback if no AI Key
    if (!aiClient) {
      return { insights: getFallbackInsights(fallbackData), error: "GEMINI_API_KEY is not configured." };
    }

    // 5. Ask Gemini to generate insights
    const prompt = `
      You are an AI business advisor for a local retail merchant in India. 
      Analyze the following business data and generate exactly 4 concise, practical, and actionable insights.
      
      CRITICAL INSTRUCTIONS FOR INSIGHTS:
      1. Be specific! If there are top customers with dues, explicitly mention their names and amounts in the description.
      2. If there are low stock products, explicitly name the products that need restocking.
      3. State actual revenue numbers and sales quantities when discussing revenue and products.
      
      Each insight must belong to one of these categories: 'revenue', 'inventory', 'khata', or 'customer'.
      Ensure the language is simple, professional, and easy for a non-technical shopkeeper to understand.
      Do not use technical jargon. Format the response as a clean JSON array of objects.
      Example structure: [{ "id": "1", "category": "revenue", "title": "Revenue Growing", "description": "You made ₹X recently. Your top seller is Y." }]

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
    let insights: Insight[] = [];
    
    try {
      insights = JSON.parse(responseText);
      // Validate schema loosely
      if (!Array.isArray(insights)) throw new Error("Not an array");
      insights = insights.slice(0, 4).map((i, idx) => ({
        id: i.id || `ai_${idx}`,
        category: (["revenue", "inventory", "khata", "customer"].includes(i.category) ? i.category : "revenue") as any,
        title: i.title || "Business Insight",
        description: i.description || "No description provided."
      }));
    } catch (e) {
      console.error("Failed to parse AI response:", responseText);
      return { insights: getFallbackInsights(fallbackData), error: "Failed to parse AI insights." };
    }

    return { insights };
  } catch (error: any) {
    console.error("Error generating insights:", error);
    return { insights: getFallbackInsights({ topCustomers: [], totalDues: 0, lowStock: [], totalRevenue: 0 }), error: error.message };
  }
}
