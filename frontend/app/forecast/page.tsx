"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

function ForecastContent() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  const [sum, setSum] = useState<any>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sumRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/metrics/summary`, {
          workspace_id,
        });
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0f0f0f] text-white">
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <h1 className="text-2xl font-semibold text-white">Revenue Forecast</h1>
            <p className="text-gray-400 mt-1">AI-powered revenue predictions and growth analysis</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Current Revenue Metrics */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Current Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">MTD Revenue</div>
                <div className="text-3xl font-semibold text-white mb-1">
                  ${sum?.mtd?.revenue?.toLocaleString() ?? 0}
                </div>
                <div className="text-sm text-gray-500">This month</div>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">YTD Revenue</div>
                <div className="text-3xl font-semibold text-white mb-1">
                  ${sum?.ytd?.revenue?.toLocaleString() ?? 0}
                </div>
                <div className="text-sm text-gray-500">This year</div>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Average Monthly</div>
                <div className="text-3xl font-semibold text-white mb-1">
                  ${sum?.months?.length > 0 
                    ? Math.round(
                        sum.months.reduce((acc: number, m: string) => 
                          acc + (sum.by_month[m]?.revenue || 0), 0
                        ) / sum.months.length
                      ).toLocaleString()
                    : 0
                  }
                </div>
                <div className="text-sm text-gray-500">Last {sum?.months?.length || 0} months</div>
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
            <h2 className="font-medium text-base mb-4 text-gray-400">Monthly Revenue Trend</h2>
            <div className="space-y-2">
              {sum?.months?.slice(-6).map((month: string) => (
                <div key={month} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-300 text-sm">{month}</span>
                  <span className="font-medium text-white text-sm">
                    ${sum.by_month[month]?.revenue?.toLocaleString() || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function Forecast() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" />
    </div>}>
      <ForecastContent />
    </Suspense>
  );
}

