"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

function CFOContent() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    loadActivity();
  }, [workspace_id]);

  const loadActivity = async () => {
    try {
      const r = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/agent/activity?workspace_id=${workspace_id}&limit=10`
      );
      const cfoActivity = r.data.activity.filter((a: any) => a.agent_name.startsWith('cfo_'));
      setActivity(cfoActivity);
    } catch (e) {}
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      const r = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/agent/insights`, {
        workspace_id,
      });
      setResult(r.data);
      await loadActivity();
    } catch (error) {
      setResult({ error: "Failed to generate insights" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8 border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">🤖 CFO Agent</h1>
                  <p className="text-gray-600 mt-2">
                    Executive-level financial insights powered by Lava AI
                  </p>
                </div>
                <button
                  onClick={generateInsights}
                  disabled={loading}
                  className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Analyzing..." : "Generate Insights"}
                </button>
              </div>

              {result && !result.error && (
                <div className="space-y-6">
                  {/* Summary Bullets */}
                  {result.summary_bullets && result.summary_bullets.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <h3 className="font-semibold text-lg mb-3 text-blue-900">📊 Summary</h3>
                      <ul className="space-y-2">
                        {result.summary_bullets.map((bullet: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-800">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risks */}
                  {result.risks && result.risks.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                      <h3 className="font-semibold text-lg mb-3 text-yellow-900">⚠️ Risks</h3>
                      <ul className="space-y-2">
                        {result.risks.map((risk: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-800">
                            <span className="text-yellow-600 mt-1">▸</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {result.suggested_actions && result.suggested_actions.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <h3 className="font-semibold text-lg mb-3 text-green-900">✅ Suggested Actions</h3>
                      <ul className="space-y-2">
                        {result.suggested_actions.map((action: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-800">
                            <span className="text-green-600 mt-1">→</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lava Attribution */}
                  <p className="text-xs text-gray-500 text-center">
                    ⚡ via Lava · llama-3.1-8b-instant · {result.latency_ms}ms
                  </p>
                </div>
              )}

              {result?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">❌ {result.error}</p>
                </div>
              )}

              {!result && (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">Click "Generate Insights" to get AI-powered CFO analysis</p>
                  <div className="text-sm text-gray-400">
                    <p>✓ Analyzes burn rate trends</p>
                    <p>✓ Identifies financial risks</p>
                    <p>✓ Provides strategic recommendations</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border sticky top-24">
              <h3 className="font-semibold text-lg mb-4">🕐 Recent Activity</h3>
              <div className="space-y-3">
                {activity.length > 0 ? (
                  activity.slice(0, 5).map((call: any) => (
                    <div key={call.id} className="text-sm border-l-2 border-indigo-500 pl-3 py-1">
                      <p className="font-medium text-gray-900">{call.agent_name.replace('cfo_', '')}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(call.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function CFOPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full" />
    </div>}>
      <CFOContent />
    </Suspense>
  );
}