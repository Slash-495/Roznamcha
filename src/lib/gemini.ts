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

export interface DailyHighlight {
  type: "success" | "warning" | "info";
  text: string;
}

export interface DailySummaryResult {
  summaryText: string;
  healthScore: number;
  highlights: DailyHighlight[];
}

export function getFallbackDailySummary(data: {
  totalSalesToday: number;
  newCustomersToday: number;
  totalDues: number;
  lowStockCount: number;
}): DailySummaryResult {
  let healthScore = 80;
  const highlights: DailyHighlight[] = [];

  if (data.totalSalesToday > 0) {
    highlights.push({ type: "success", text: `₹${data.totalSalesToday.toLocaleString()} in sales today` });
    healthScore += 5;
  } else {
    highlights.push({ type: "info", text: "No sales recorded today yet" });
    healthScore -= 10;
  }

  if (data.newCustomersToday > 0) {
    highlights.push({ type: "success", text: `${data.newCustomersToday} new customers added` });
    healthScore += 5;
  }

  if (data.totalDues > 10000) {
    highlights.push({ type: "warning", text: `High pending dues: ₹${data.totalDues.toLocaleString()}` });
    healthScore -= 10;
  } else if (data.totalDues > 0) {
    highlights.push({ type: "warning", text: `Pending dues: ₹${data.totalDues.toLocaleString()}` });
    healthScore -= 5;
  }

  if (data.lowStockCount > 0) {
    highlights.push({ type: "warning", text: `${data.lowStockCount} items low on stock` });
    healthScore -= (data.lowStockCount * 2);
  } else {
    highlights.push({ type: "success", text: "Inventory levels look great" });
    healthScore += 5;
  }

  if (healthScore > 100) healthScore = 100;
  if (healthScore < 0) healthScore = 0;

  let summaryText = `Your business generated ₹${data.totalSalesToday.toLocaleString()} in sales today. `;
  if (data.newCustomersToday > 0) {
    summaryText += `You welcomed ${data.newCustomersToday} new customers. `;
  }
  if (data.lowStockCount > 0) {
    summaryText += `You have ${data.lowStockCount} items that need restocking soon. `;
  }
  if (data.totalDues > 0) {
    summaryText += `Keep an eye on ₹${data.totalDues.toLocaleString()} in pending customer dues.`;
  }

  return { summaryText, healthScore, highlights };
}
