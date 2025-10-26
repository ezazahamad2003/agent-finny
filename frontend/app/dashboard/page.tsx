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
import Navbar from "@/components/Navbar";

Chart.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip, Title);

export default function Dashboard() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  const name = sp.get("name") || "Your Startup";
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

  const months = sum?.months || [];
  const rev = months.map((m: string) => sum.by_month[m].revenue || 0);
  const exp = months.map((m: string) => sum.by_month[m].expense || 0);

  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="text-gray-400 mt-1">{name}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Metrics */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              title="Cash"
              value={`$${(burn?.cash ?? 0).toLocaleString()}`}
              subtitle="Current balance"
            />
            <KpiCard
              title="Burn Rate"
              value={`$${(burn?.burn_avg_3m ?? 0).toLocaleString()}/mo`}
              subtitle="3-month average"
            />
            <KpiCard
              title="Runway"
              value={`${burn?.runway_months ?? "∞"} mo`}
              subtitle={
                burn?.runway_months && burn.runway_months < 6
                  ? "Action needed"
                  : "On track"
              }
              alert={burn?.runway_months && burn.runway_months < 6}
            />
            <KpiCard
              title="Net (MTD)"
              value={`$${sum?.mtd?.net?.toLocaleString() ?? 0}`}
              subtitle="This month"
            />
          </div>
        </div>

        {/* MTD/YTD Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
            <h2 className="font-medium text-base mb-4 text-gray-400">Month-to-Date</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Revenue</span>
                <span className="font-semibold text-neon-green">
                  ${sum?.mtd?.revenue?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expense</span>
                <span className="font-semibold text-red-400">
                  ${sum?.mtd?.expense?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-800">
                <span className="font-medium text-gray-300">Net</span>
                <span
                  className={`font-bold ${
                    (sum?.mtd?.net ?? 0) >= 0 ? "text-neon-green" : "text-red-400"
                  }`}
                >
                  ${sum?.mtd?.net?.toLocaleString() ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
            <h2 className="font-medium text-base mb-4 text-gray-400">Year-to-Date</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Revenue</span>
                <span className="font-semibold text-neon-green">
                  ${sum?.ytd?.revenue?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expense</span>
                <span className="font-semibold text-red-400">
                  ${sum?.ytd?.expense?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-800">
                <span className="font-medium text-gray-300">Net</span>
                <span
                  className={`font-bold ${
                    (sum?.ytd?.net ?? 0) >= 0 ? "text-neon-green" : "text-red-400"
                  }`}
                >
                  ${sum?.ytd?.net?.toLocaleString() ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <h2 className="font-medium text-base mb-4 text-gray-400">Monthly Revenue vs Expense</h2>
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
                  labels: {
                    color: "white"
                  }
                },
                title: {
                  display: true,
                  text: "Monthly Financial Overview",
                  color: "white"
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: "#3b82f6"
                  },
                  ticks: {
                    color: "white"
                  }
                },
                x: {
                  grid: {
                    color: "#3b82f6"
                  },
                  ticks: {
                    color: "white"
                  }
                }
              },
            }}
          />
        </div>

        {/* Top Categories */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <h2 className="font-medium text-base mb-4 text-gray-400">Top Expense Categories</h2>
          <ul className="space-y-3">
            {sum?.top_categories?.map((c: any) => (
              <li key={c.category} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                <span className="text-gray-300 text-sm">{c.category}</span>
                <span className="font-medium text-white text-sm">
                  ${c.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
    </>
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
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="text-sm text-gray-400 mb-2">{title}</div>
      <div className="text-3xl font-semibold text-white mb-1">{value}</div>
      {subtitle && (
        <div className={`text-sm ${alert ? "text-red-400 font-medium" : "text-gray-500"}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

