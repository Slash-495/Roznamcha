"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, CheckCircle2, AlertTriangle, Info, Clock, History } from "lucide-react";
import { format } from "date-fns";
import { generateDailySummary, getRecentSummaries } from "../../actions/daily-summary";
import { DailySummaryResult } from "@/lib/gemini";

interface SummaryHistoryRow {
  id: string;
  summary_text: string;
  health_score: number;
  generated_at: string;
}

export function AiDailySummaryWidget() {
  const [currentSummary, setCurrentSummary] = useState<DailySummaryResult | null>(null);
  const [history, setHistory] = useState<SummaryHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const past = await getRecentSummaries();
      setHistory(past);
      // If we have one from today, show it, otherwise show nothing or prompt to generate
      if (past.length > 0) {
        const latest = past[0];
        const isToday = new Date(latest.generated_at).toDateString() === new Date().toDateString();
        if (isToday) {
          setCurrentSummary({
            summaryText: latest.summary_text,
            healthScore: latest.health_score,
            highlights: latest.highlights || []
          });
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateDailySummary();
      if (result.error && !result.summary) {
        setError(result.error);
      } else if (result.summary) {
        setCurrentSummary(result.summary);
        // Refresh history to include the newly generated summary
        const past = await getRecentSummaries();
        setHistory(past);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 75) return "text-emerald-600 bg-emerald-50";
    if (score >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getHealthStatus = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 50) return "Needs Attention";
    return "Critical";
  };

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-24 bg-gray-100 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="border-b bg-gray-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-lg">AI Daily Summary</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs h-8"
          >
            <History className="mr-2 h-3 w-3" />
            {showHistory ? "Hide History" : "View History"}
          </Button>
          <Button 
            size="sm" 
            onClick={handleGenerate} 
            disabled={generating}
            className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Sparkles className={`mr-2 h-3 w-3 ${generating ? "animate-pulse" : ""}`} />
            {generating ? "Generating..." : "Generate Today's"}
          </Button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {showHistory ? (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-2">Recent Summaries</h4>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center">No past summaries found.</p>
            ) : (
              <div className="space-y-3">
                {history.map((row) => (
                  <div key={row.id} className="p-4 rounded-lg border bg-gray-50/50 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(row.generated_at), "PPP p")}
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getHealthColor(row.health_score)}`}>
                        {row.health_score}/100 • {getHealthStatus(row.health_score)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{row.summary_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !currentSummary ? (
          <div className="text-center p-8 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
            <Calendar className="h-10 w-10 text-indigo-300 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-1">No summary generated today</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Generate a fresh AI summary to get a quick overview of today's sales, stock alerts, and outstanding dues.
            </p>
            <Button onClick={handleGenerate} disabled={generating} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Sparkles className={`mr-2 h-4 w-4 ${generating ? "animate-pulse" : ""}`} />
              {generating ? "Analyzing your data..." : "Generate Summary"}
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50/30 rounded-xl border border-indigo-100">
                <p className="text-gray-800 leading-relaxed text-[15px]">
                  {currentSummary.summaryText}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {currentSummary.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm">
                    <div className={`p-2 rounded-full ${
                      highlight.type === 'success' ? 'bg-green-50' : 
                      highlight.type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
                    }`}>
                      {getHighlightIcon(highlight.type)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{highlight.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="p-6 rounded-xl border bg-gray-50 flex flex-col items-center justify-center text-center h-full">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Business Health</p>
                <div className={`text-5xl font-black mb-2 tracking-tighter ${getHealthColor(currentSummary.healthScore).split(' ')[0]}`}>
                  {currentSummary.healthScore}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${getHealthColor(currentSummary.healthScore)}`}>
                  {getHealthStatus(currentSummary.healthScore)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
