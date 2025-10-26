"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { Bar } from "react-chartjs-2";
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Title,
} from "chart.js";

Chart.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip, Title);

export default function Dashboard() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id")!;
  const name = sp.get("name") || "Your Startup";
  const [burn, setBurn] = useState<any>();
  const [sum, setSum] = useState<any>();
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);

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

  const askFinny = async () => {
    setInsightLoading(true);
    try {
      const r = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/agent/insights`, {
        workspace_id,
      });
      setInsight(r.data.answer);
    } catch (error) {
      console.error("Error fetching insights:", error);
      setInsight("Failed to fetch insights. Please try again.");
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your financial dashboard...</p>
        </div>
      </main>
    );
  }

  const months = sum?.months || [];
  const rev = months.map((m: string) => sum.by_month[m].revenue || 0);
  const exp = months.map((m: string) => sum.by_month[m].expense || 0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🤖 Agent Finny</h1>
              <p className="text-sm text-gray-600">{name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Workspace</p>
              <p className="text-xs font-mono text-gray-600">{workspace_id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            title="💰 Cash"
            value={`$${(burn?.cash ?? 0).toLocaleString()}`}
            subtitle="Current balance"
          />
          <KpiCard
            title="🔥 Burn Rate"
            value={`$${(burn?.burn_avg_3m ?? 0).toLocaleString()}/mo`}
            subtitle="3-month average"
          />
          <KpiCard
            title="📅 Runway"
            value={`${burn?.runway_months ?? "∞"} months`}
            subtitle={
              burn?.runway_months && burn.runway_months < 6
                ? "⚠️ Action needed"
                : "On track"
            }
            alert={burn?.runway_months && burn.runway_months < 6}
          />
        </div>

        {/* MTD/YTD Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="font-semibold text-lg mb-4">📊 Month-to-Date</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-green-600">
                  ${sum?.mtd?.revenue?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expense</span>
                <span className="font-semibold text-red-600">
                  ${sum?.mtd?.expense?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Net</span>
                <span
                  className={`font-bold ${
                    (sum?.mtd?.net ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ${sum?.mtd?.net?.toLocaleString() ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="font-semibold text-lg mb-4">📈 Year-to-Date</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-green-600">
                  ${sum?.ytd?.revenue?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expense</span>
                <span className="font-semibold text-red-600">
                  ${sum?.ytd?.expense?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Net</span>
                <span
                  className={`font-bold ${
                    (sum?.ytd?.net ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ${sum?.ytd?.net?.toLocaleString() ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">📊 Monthly Revenue vs Expense</h2>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: "Revenue",
                  data: rev,
                  backgroundColor: "rgba(34, 197, 94, 0.8)",
                },
                {
                  label: "Expense",
                  data: exp,
                  backgroundColor: "rgba(239, 68, 68, 0.8)",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top" as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">🏷️ Top Expense Categories</h2>
          <ul className="space-y-2">
            {sum?.top_categories?.map((c: any) => (
              <li key={c.category} className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">{c.category}</span>
                <span className="font-semibold text-red-600">
                  ${c.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* AI CFO Insights */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm p-6 border border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <span>🤖</span> AI CFO Insights
            </h2>
            <button
              className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm"
              onClick={askFinny}
              disabled={insightLoading}
            >
              {insightLoading ? "Thinking..." : "Ask Finny"}
            </button>
          </div>
          {insight ? (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                {insight}
              </pre>
            </div>
          ) : (
            <p className="text-gray-600 text-sm italic">
              Click "Ask Finny" to get AI-powered financial insights powered by Lava.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  alert,
}: {
  title: string;
  value: string;
  subtitle?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-6 border ${
        alert ? "border-red-300 bg-red-50" : ""
      }`}
    >
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && (
        <div className={`text-xs ${alert ? "text-red-600 font-medium" : "text-gray-500"}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

