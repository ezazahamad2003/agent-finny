"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

function ScenarioContent() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  
  const [raiseAmount, setRaiseAmount] = useState("50000");
  const [cuts, setCuts] = useState([{ category: "SaaS", delta_pct: -30 }]);
  const [revenueGrowth, setRevenueGrowth] = useState("");
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
      const scenarioActivity = r.data.activity.filter((a: any) => a.agent_name === 'cfo_scenario');
      setActivity(scenarioActivity);
    } catch (e) {}
  };

  const runScenario = async () => {
    setLoading(true);
    try {
      const payload: any = {
        workspace_id,
        raise_amount: raiseAmount ? parseFloat(raiseAmount) : undefined,
        cuts: cuts.filter(c => c.category && c.delta_pct),
        revenue_growth_pct: revenueGrowth ? parseFloat(revenueGrowth) : undefined,
      };

      const r = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/agent/what_if`,
        payload
      );
      setResult(r.data);
      await loadActivity();
    } catch (error) {
      setResult({ error: "Failed to run scenario" });
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Scenario Planner</h1>
              <p className="text-gray-600 mb-8">
                Run what-if simulations to see impact on your runway
              </p>

              <div className="space-y-6">
                {/* Raise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 Funding Raise ($)
                  </label>
                  <input
                    type="number"
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="50000"
                  />
                </div>

                {/* Expense Cuts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ✂️ Expense Cuts
                  </label>
                  {cuts.map((cut, idx) => (
                    <div key={idx} className="flex gap-3 mb-3">
                      <select
                        value={cut.category}
                        onChange={(e) => {
                          const newCuts = [...cuts];
                          newCuts[idx].category = e.target.value;
                          setCuts(newCuts);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="SaaS">SaaS</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Payroll">Payroll</option>
                        <option value="Travel">Travel</option>
                        <option value="Office">Office</option>
                        <option value="Equipment">Equipment</option>
                      </select>
                      <input
                        type="number"
                        value={Math.abs(cut.delta_pct)}
                        onChange={(e) => {
                          const newCuts = [...cuts];
                          newCuts[idx].delta_pct = -Math.abs(parseFloat(e.target.value) || 0);
                          setCuts(newCuts);
                        }}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="30"
                      />
                      <span className="flex items-center text-gray-600">% cut</span>
                    </div>
                  ))}
                </div>

                {/* Revenue Growth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📈 Revenue Growth (%)
                  </label>
                  <input
                    type="number"
                    value={revenueGrowth}
                    onChange={(e) => setRevenueGrowth(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="20"
                  />
                </div>

                <button
                  onClick={runScenario}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Simulating..." : "Run Simulation"}
                </button>
              </div>
            </div>

            {/* Results */}
            {result && !result.error && (
              <div className="bg-white rounded-xl shadow-sm p-6 border">
                <h2 className="font-semibold text-lg mb-4">📊 Scenario Results</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="font-medium text-blue-900">{result.scenario}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Current State</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cash</span>
                        <span className="font-semibold">${result.new_cash?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Burn</span>
                        <span className="font-semibold">${result.new_burn?.toLocaleString() || '0'}/mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="text-sm font-medium text-green-700 mb-3">Projected State</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">New Cash</span>
                        <span className="font-semibold text-green-700">
                          ${result.new_cash?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">New Burn</span>
                        <span className="font-semibold text-green-700">
                          ${result.new_burn?.toLocaleString() || '0'}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-lg p-4 mb-6 ${
                    result.runway_change > 0
                      ? "bg-green-100 border border-green-300"
                      : result.runway_change < 0
                      ? "bg-red-100 border border-red-300"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">New Runway</p>
                      <p className="text-3xl font-bold">
                        {result.runway_months} months
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Change</p>
                      <p className={`text-2xl font-bold ${
                        result.runway_change > 0 ? 'text-green-700' : 
                        result.runway_change < 0 ? 'text-red-700' : 'text-gray-700'
                      }`}>
                        {result.runway_change > 0 ? '+' : ''}
                        {result.runway_change} mo
                      </p>
                    </div>
                  </div>
                </div>

                {result.explanation && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                    <h3 className="font-semibold mb-3">🤖 AI Strategic Analysis</h3>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {typeof result.explanation === 'string' 
                        ? result.explanation 
                        : JSON.stringify(result.explanation, null, 2)}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      ⚡ via Lava · llama-3.1-8b-instant · {result.latency_ms}ms
                    </p>
                  </div>
                )}
              </div>
            )}

            {result?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">❌ {result.error}</p>
              </div>
            )}
          </div>

          {/* Activity Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border sticky top-24">
              <h3 className="font-semibold text-lg mb-4">🕐 Recent Scenarios</h3>
              <div className="space-y-3">
                {activity.length > 0 ? (
                  activity.slice(0, 5).map((call: any) => (
                    <div key={call.id} className="text-sm border-l-2 border-green-500 pl-3 py-1">
                      <p className="font-medium text-gray-900">
                        {call.input?.scenario || 'Scenario'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(call.created_at).toLocaleTimeString()}
                      </p>
                      {call.output && (
                        <p className="text-xs text-green-600 mt-1">
                          {call.output.change_months > 0 ? '+' : ''}
                          {call.output.change_months}mo runway
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No scenarios yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function ScenarioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>}>
      <ScenarioContent />
    </Suspense>
  );
}

