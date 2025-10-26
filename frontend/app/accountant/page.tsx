"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

function AccountantContent() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  
  const [categorizeResult, setCategorizeResult] = useState<any>(null);
  const [anomaliesResult, setAnomaliesResult] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    loadActivity();
  }, [workspace_id]);

  const loadActivity = async () => {
    try {
      const r = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/agent/activity?workspace_id=${workspace_id}&limit=10`
      );
      const accountantActivity = r.data.activity.filter((a: any) => a.agent_name.startsWith('accountant_'));
      setActivity(accountantActivity);
    } catch (e) {}
  };

  const runCategorize = async () => {
    setLoading("categorize");
    try {
      const r = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/agent/categorize`,
        { workspace_id, limit: 40 }
      );
      setCategorizeResult(r.data);
      await loadActivity();
    } catch (error) {
      setCategorizeResult({ error: "Failed to categorize" });
    } finally {
      setLoading(null);
    }
  };

  const runAnomalies = async () => {
    setLoading("anomalies");
    try {
      const r = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/agent/anomalies`,
        { workspace_id }
      );
      setAnomaliesResult(r.data);
      await loadActivity();
    } catch (error) {
      setAnomaliesResult({ error: "Failed to detect anomalies" });
    } finally {
      setLoading(null);
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Accountant Agent</h1>
              <p className="text-gray-600 mb-8">
                Auto-categorize transactions and detect spending anomalies
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={runCategorize}
                  disabled={loading === "categorize"}
                  className="px-6 py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading === "categorize" ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Categorizing...
                    </>
                  ) : (
                    <>🏷️ Auto-Categorize</>
                  )}
                </button>
                
                <button
                  onClick={runAnomalies}
                  disabled={loading === "anomalies"}
                  className="px-6 py-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading === "anomalies" ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Detecting...
                    </>
                  ) : (
                    <>🔍 Detect Anomalies</>
                  )}
                </button>
              </div>

              {/* Categorization Results */}
              {categorizeResult && (
                <div className="bg-white rounded-xl border mb-6">
                  <div className="p-6">
                    <h2 className="font-semibold text-lg mb-4">✅ Categorization Results</h2>
                    {categorizeResult.error ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700">❌ {categorizeResult.error}</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-900 font-medium text-lg mb-2">
                            ✨ Categorized {categorizeResult.categorized} of {categorizeResult.analyzed} transactions
                          </p>
                          <p className="text-sm text-green-700">
                            ⚡ via Lava · llama-3.1-8b-instant · {categorizeResult.latency_ms}ms
                          </p>
                        </div>
                        {categorizeResult.message && (
                          <p className="text-sm text-gray-600 mt-3">{categorizeResult.message}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Anomalies Results */}
              {anomaliesResult && (
                <div className="bg-white rounded-xl border">
                  <div className="p-6">
                    <h2 className="font-semibold text-lg mb-4">🔍 Anomaly Detection</h2>
                    
                    {anomaliesResult.error ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700">❌ {anomaliesResult.error}</p>
                      </div>
                    ) : anomaliesResult.alerts?.length > 0 ? (
                      <div className="space-y-4">
                        {anomaliesResult.alerts.map((alert: any, idx: number) => (
                          <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-gray-900">{alert.title}</p>
                                <p className="text-sm text-gray-600">{alert.entity}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                alert.urgency === 'high' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {alert.urgency} urgency
                              </span>
                            </div>
                            <p className="text-lg font-bold text-yellow-700 mb-1">{alert.delta}</p>
                            <p className="text-sm text-yellow-800">⚠️ {alert.why}</p>
                          </div>
                        ))}
                        
                        {anomaliesResult.explanation && (
                          <div className="bg-gray-50 rounded-lg p-4 mt-4">
                            <h3 className="font-medium mb-2">AI Analysis:</h3>
                            <p className="text-sm text-gray-700">{anomaliesResult.explanation}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              ⚡ via Lava · llama-3.1-8b-instant · {anomaliesResult.latency_ms}ms
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-green-600">✅ No anomalies detected - spending looks normal!</p>
                    )}
                  </div>
                </div>
              )}

              {!categorizeResult && !anomaliesResult && (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">Choose an action to get started</p>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>🏷️ Auto-Categorize: AI assigns categories to transactions</p>
                    <p>🔍 Detect Anomalies: Find unusual spending patterns</p>
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
                    <div key={call.id} className="text-sm border-l-2 border-purple-500 pl-3 py-1">
                      <p className="font-medium text-gray-900">
                        {call.agent_name.replace('accountant_', '')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(call.created_at).toLocaleTimeString()}
                      </p>
                      {call.output && (
                        <p className="text-xs text-gray-600 mt-1">
                          {call.output.categorized && `${call.output.categorized} categorized`}
                          {call.output.alerts !== undefined && `${call.output.alerts} alerts`}
                        </p>
                      )}
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

export default function AccountantPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>}>
      <AccountantContent />
    </Suspense>
  );
}