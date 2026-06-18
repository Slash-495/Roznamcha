"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Package, Users, CreditCard, RefreshCw, AlertCircle } from "lucide-react";
import { Insight } from "@/lib/gemini";
import { generateBusinessInsights } from "../../actions/insights";

export function AiInsightsWidget() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateBusinessInsights();
      if (result.error && result.insights.length === 0) {
        setError(result.error);
      } else {
        setInsights(result.insights);
        // Show warning if it's falling back but we still have insights
        if (result.error) {
          console.warn("Using fallback insights due to error:", result.error);
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getIcon = (category: string) => {
    switch (category) {
      case "revenue": return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "inventory": return <Package className="h-5 w-5 text-blue-600" />;
      case "khata": return <CreditCard className="h-5 w-5 text-red-600" />;
      case "customer": return <Users className="h-5 w-5 text-purple-600" />;
      default: return <Sparkles className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col h-full">
      <div className="border-b bg-gray-50/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-lg">AI Business Insights</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchInsights} 
          disabled={loading}
          className="text-xs h-8"
        >
          <RefreshCw className={`mr-2 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Generating..." : "Generate New"}
        </Button>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : error && insights.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground flex flex-col items-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm">{error}</p>
            <Button variant="link" onClick={fetchInsights} className="mt-2">Try Again</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {insights.map((insight) => (
              <div key={insight.id} className="flex gap-4 items-start p-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-full flex-shrink-0 ${
                  insight.category === 'revenue' ? 'bg-green-50' : 
                  insight.category === 'inventory' ? 'bg-blue-50' : 
                  insight.category === 'khata' ? 'bg-red-50' : 
                  'bg-purple-50'
                }`}>
                  {getIcon(insight.category)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
