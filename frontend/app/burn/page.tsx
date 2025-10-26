"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function BurnRate() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  const [burn, setBurn] = useState<any>();
  const [sum, setSum] = useState<any>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [burnRes, sumRes] = await Promise.all([
          axios.post(`${process.env.NEXT_PUBLIC_API_URL}/metrics/burn_runway`, {
            workspace_id,
          }),
          axios.post(`${process.env.NEXT_PUBLIC_API_URL}/metrics/summary`, {
            workspace_id,
          }),
        ]);
        setBurn(burnRes.data);
        setSum(sumRes.data);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [workspace_id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </main>
      </>
    );
  }

  const runwayStatus = burn?.runway_months < 6 ? "critical" : burn?.runway_months < 12 ? "warning" : "healthy";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0f0f0f] text-white">
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <h1 className="text-2xl font-semibold text-white">Burn Rate Analysis</h1>
            <p className="text-gray-400 mt-1">Monitor your burn rate and extend your runway</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Key Metrics */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Monthly Burn Rate</div>
                <div className="text-3xl font-semibold text-white mb-1">
                  ${burn?.burn_avg_3m?.toLocaleString() ?? 0}
                </div>
                <div className="text-sm text-gray-500">3-month average</div>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Current Cash</div>
                <div className="text-3xl font-semibold text-white mb-1">
                  ${burn?.cash?.toLocaleString() ?? 0}
                </div>
                <div className="text-sm text-gray-500">Available balance</div>
              </div>

              <div className={`bg-[#1a1a1a] rounded-lg p-6 border ${
                runwayStatus === "critical" ? "border-red-500/50" : 
                runwayStatus === "warning" ? "border-yellow-500/50" : 
                "border-gray-800"
              }`}>
                <div className="text-sm text-gray-400 mb-2">Runway</div>
                <div className={`text-3xl font-semibold mb-1 ${
                  runwayStatus === "critical" ? "text-red-400" : 
                  runwayStatus === "warning" ? "text-yellow-400" : 
                  "text-white"
                }`}>
                  {burn?.runway_months ?? "∞"} mo
                </div>
                <div className={`text-sm font-medium ${
                  runwayStatus === "critical" ? "text-red-400" : 
                  runwayStatus === "warning" ? "text-yellow-400" : 
                  "text-gray-500"
                }`}>
                  {runwayStatus === "critical" ? "⚠️ Action needed" : 
                   runwayStatus === "warning" ? "⚠️ Monitor closely" : 
                   "✓ Healthy"}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
              <h2 className="font-medium text-base mb-4 text-gray-400">This Month</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Revenue</span>
                  <span className="font-medium text-green-400 text-sm">
                    ${sum?.mtd?.revenue?.toLocaleString() ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Expenses</span>
                  <span className="font-medium text-red-400 text-sm">
                    ${sum?.mtd?.expense?.toLocaleString() ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                  <span className="font-medium text-gray-300">Net Burn</span>
                  <span className={`font-bold ${
                    (sum?.mtd?.net ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    ${Math.abs(sum?.mtd?.net ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
              <h2 className="font-medium text-base mb-4 text-gray-400">Top Expense Categories</h2>
              <div className="space-y-3">
                {sum?.top_categories?.slice(0, 5).map((c: any) => (
                  <div key={c.category} className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">{c.category}</span>
                    <span className="font-medium text-white text-sm">
                      ${c.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

