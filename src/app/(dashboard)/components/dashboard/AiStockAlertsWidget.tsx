"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, PackageMinus, RefreshCw, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { StockAlert } from "@/lib/gemini";
import { generateStockAlerts } from "../../actions/stock-alerts";

export function AiStockAlertsWidget() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateStockAlerts();
      if (result.error && result.alerts.length === 0) {
        setError(result.error);
      } else {
        setAlerts(result.alerts);
        setScore(result.score);
        if (result.error) {
          console.warn("Using fallback stock alerts due to error:", result.error);
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "critical": return <PackageMinus className="h-5 w-5 text-red-600" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "fast_moving": return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "slow_moving": return <TrendingDown className="h-5 w-5 text-blue-600" />;
      default: return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="border-b bg-gray-50/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-lg">AI Stock Alerts</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAlerts} 
          disabled={loading}
          className="text-xs h-8"
        >
          <RefreshCw className={`mr-2 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh Alerts"}
        </Button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error && alerts.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground flex flex-col items-center justify-center flex-1">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm">{error}</p>
            <Button variant="link" onClick={fetchAlerts} className="mt-2">Try Again</Button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Inventory Health Score</p>
                <div className="flex items-center gap-3">
                  <span className={`text-3xl font-bold ${
                    score >= 80 ? 'text-green-600' : 
                    score >= 50 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {score}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground mt-2">/ 100</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex gap-4 items-start p-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    alert.type === 'critical' ? 'bg-red-50' : 
                    alert.type === 'warning' ? 'bg-yellow-50' : 
                    alert.type === 'fast_moving' ? 'bg-green-50' : 
                    'bg-blue-50'
                  }`}>
                    {getIcon(alert.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        alert.type === 'critical' ? 'bg-red-100 text-red-700' : 
                        alert.type === 'warning' ? 'bg-yellow-100 text-yellow-700' : 
                        alert.type === 'fast_moving' ? 'bg-green-100 text-green-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {alert.type.replace('_', ' ')}
                      </span>
                      <h4 className="font-semibold text-sm">{alert.productName}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{alert.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
