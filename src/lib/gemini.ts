import { GoogleGenAI } from "@google/genai";

// Ensure the API key is provided
const apiKey = process.env.GEMINI_API_KEY;

// Initialize the Gemini client. We use lazy initialization to not crash if the key is missing at build time.
let aiClient: GoogleGenAI | null = null;

export function getGeminiClient() {
  if (aiClient) return aiClient;
  
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will fallback to rule-based logic.");
    return null;
  }
  
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

export interface Insight {
  id: string;
  category: "revenue" | "inventory" | "khata" | "customer";
  title: string;
  description: string;
}

export function getFallbackInsights(data: {
  topCustomers: string[];
  totalDues: number;
  lowStock: string[];
  totalRevenue: number;
}): Insight[] {
  const insights: Insight[] = [];
  
  insights.push({
    id: "fb_rev",
    category: "revenue",
    title: "Monitor Your Sales",
    description: `You have generated ₹${data.totalRevenue.toLocaleString()} in recent revenue. Keep tracking your daily sales.`
  });

  if (data.totalDues > 0) {
    insights.push({
      id: "fb_khata",
      category: "khata",
      title: "Pending Dues Action Required",
      description: `You have ₹${data.totalDues.toLocaleString()} in pending dues. Top customers to follow up with: ${data.topCustomers.join(", ") || "None"}.`
    });
  }

  if (data.lowStock.length > 0) {
    insights.push({
      id: "fb_inv",
      category: "inventory",
      title: "Stock Management Alert",
      description: `The following items are running out of stock: ${data.lowStock.join(", ")}. Consider restocking them soon.`
    });
  } else {
    insights.push({
      id: "fb_inv",
      category: "inventory",
      title: "Stock Management",
      description: "Your inventory levels look healthy. Ensure your top-selling items are always adequately stocked."
    });
  }

  return insights;
}
