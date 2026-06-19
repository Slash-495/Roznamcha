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

export interface StockAlert {
  id: string;
  type: "critical" | "warning" | "fast_moving" | "slow_moving";
  productName: string;
  recommendation: string;
}

export function getFallbackStockAlerts(data: {
  critical: string[];
  warning: string[];
  fast: string[];
  slow: string[];
}): { score: number; alerts: StockAlert[] } {
  const alerts: StockAlert[] = [];
  
  // Basic health score calculation
  const totalIssues = data.critical.length * 2 + data.warning.length + data.slow.length;
  let score = 100 - (totalIssues * 5);
  if (score < 0) score = 0;
  if (data.fast.length > 0) score += 5;
  if (score > 100) score = 100;

  // Add Critical
  data.critical.slice(0, 2).forEach((prod, i) => {
    alerts.push({
      id: `crit_${i}`,
      type: "critical",
      productName: prod,
      recommendation: `Out of stock! Restock immediately to avoid losing sales.`
    });
  });

  // Add Warning
  data.warning.slice(0, 2).forEach((prod, i) => {
    alerts.push({
      id: `warn_${i}`,
      type: "warning",
      productName: prod,
      recommendation: `Below minimum threshold. Consider ordering more soon.`
    });
  });

  // Add Fast Moving
  data.fast.slice(0, 1).forEach((prod, i) => {
    alerts.push({
      id: `fast_${i}`,
      type: "fast_moving",
      productName: prod,
      recommendation: `Selling rapidly. Ensure you have enough supply for the coming weeks.`
    });
  });

  // Add Slow Moving
  data.slow.slice(0, 1).forEach((prod, i) => {
    alerts.push({
      id: `slow_${i}`,
      type: "slow_moving",
      productName: prod,
      recommendation: `Hasn't moved recently. Consider a discount or promotional placement.`
    });
  });

  // Fill up to 4 if we don't have enough
  if (alerts.length === 0) {
    alerts.push({
      id: "healthy_1",
      type: "fast_moving",
      productName: "Inventory Healthy",
      recommendation: "Your stock levels are well balanced and nothing requires immediate attention."
    });
  }

  return { score, alerts: alerts.slice(0, 4) };
}
