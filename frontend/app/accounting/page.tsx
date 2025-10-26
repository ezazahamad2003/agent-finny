"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Transaction {
  id: string;
  ts: string;
  amount: number;
  category: string;
  merchant: string;
  source: string;
}

function AccountingContent() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  
  const [insights, setInsights] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Fetch transactions
  useEffect(() => {
    fetchTransactions();
  }, [workspace_id, selectedCategory]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions/list`,
        {
          params: {
            workspace_id,
            limit: 100,
            category: selectedCategory === "all" ? undefined : selectedCategory,
          },
        }
      );
      setTransactions(response.data.transactions || []);
      setCategories(["all", ...(response.data.categories || [])]);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/agent/accounting-insights`,
        { workspace_id }
      );
      setInsights(response.data.insights);
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsights("Failed to generate insights. Please try again.");
    } finally {
      setInsightsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatAmount = (amount: number) => {
    const isExpense = amount < 0;
    return (
      <span className={isExpense ? "text-red-400" : "text-green-400"}>
        {isExpense ? "-" : "+"}${Math.abs(amount).toLocaleString()}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0f0f0f] text-white">
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <h1 className="text-2xl font-semibold text-white">Accounting</h1>
            <p className="text-gray-400 mt-1">Track spending, analyze P&L, and get AI insights</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Feature 2: Auto P&L Snapshot */}
          {summary && (
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">📊 Auto P&L Snapshot</h2>
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors">
                  Download PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* MTD */}
                <div className="bg-[#0f0f0f] rounded-lg p-4 border border-gray-800">
                  <div className="text-xs text-gray-500 uppercase mb-3">Month to Date</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Revenue</span>
                      <span className="text-sm font-medium text-green-400">
                        ${summary.mtd_revenue?.toLocaleString() ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Expenses</span>
                      <span className="text-sm font-medium text-red-400">
                        ${Math.abs(summary.mtd_expense)?.toLocaleString() ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                      <span className="text-sm font-semibold text-white">Net</span>
                      <span className={`text-sm font-bold ${
                        summary.mtd_net >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        ${summary.mtd_net?.toLocaleString() ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="bg-[#0f0f0f] rounded-lg p-4 border border-gray-800">
                  <div className="text-xs text-gray-500 uppercase mb-3">Key Metrics</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Cash Balance</span>
                      <span className="text-sm font-medium text-white">
                        ${summary.cash?.toLocaleString() ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Burn Rate</span>
                      <span className="text-sm font-medium text-white">
                        ${summary.burn_rate?.toLocaleString() ?? 0}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                      <span className="text-sm font-semibold text-white">Runway</span>
                      <span className="text-sm font-bold text-white">
                        {summary.runway_months ?? "∞"} mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Categories */}
                <div className="bg-[#0f0f0f] rounded-lg p-4 border border-gray-800">
                  <div className="text-xs text-gray-500 uppercase mb-3">Top Expense Categories</div>
                  <div className="space-y-2">
                    {summary.top_categories?.slice(0, 3).map((cat: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 truncate mr-2">{cat.category}</span>
                        <span className="text-sm font-medium text-white">
                          ${cat.amount?.toLocaleString() ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feature 3: FINNY CFO Insights */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">🧠 FINNY CFO Insights</h2>
              <button
                onClick={generateInsights}
                disabled={insightsLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {insightsLoading ? "Analyzing..." : "Get Recommendations"}
              </button>
            </div>
            
            {insights ? (
              <div className="bg-[#0f0f0f] rounded-lg p-4 border border-gray-800">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
                  {insights}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Click "Get Recommendations" to receive AI-powered CFO insights on spending patterns, anomalies, and optimization opportunities.
              </p>
            )}
          </div>

          {/* Feature 1: Live Categorized Transactions */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">🔍 Live Categorized Transactions</h2>
                <p className="text-sm text-gray-500">
                  {summary?.total_transactions || transactions.length} total transactions
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchTransactions}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No transactions found. Connect your bank to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-800">
                      <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Date</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Merchant</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Category</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400 uppercase text-right">Amount</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-800/50 hover:bg-[#0f0f0f] transition-colors">
                        <td className="py-3 text-sm text-gray-400">{formatDate(txn.ts)}</td>
                        <td className="py-3 text-sm text-white font-medium">{txn.merchant || "N/A"}</td>
                        <td className="py-3">
                          <span className="inline-block px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                            {txn.category || "Other"}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-right font-medium">
                          {formatAmount(txn.amount)}
                        </td>
                        <td className="py-3 text-xs text-gray-500">{txn.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function Accounting() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" />
    </div>}>
      <AccountingContent />
    </Suspense>
  );
}

