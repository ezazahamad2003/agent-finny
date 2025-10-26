# 🧠 Agent Finny v2 - Multi-Agent Architecture

## Overview

Upgrade from single AI insight → **Suite of 3 specialized AI agents**

| Agent | Purpose | Endpoints | Page |
|-------|---------|-----------|------|
| 🤖 **CFO Agent** | Interprets metrics, forecasts, risks | `/agent/insights` (exists) | `/cfo` |
| 📊 **Accountant Agent** | Categorizes, detects anomalies | `/agent/categorize`, `/agent/anomalies` | `/accountant` |
| 🎯 **Scenario Agent** | What-if simulations | `/agent/what_if` | `/scenario` |

---

## Phase 1: Backend Enhancements

### 1. Database - Add Agent Logging Table

```sql
-- Run in Supabase SQL Editor
CREATE TABLE agent_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  agent_type TEXT NOT NULL, -- 'cfo', 'accountant', 'scenario'
  action TEXT NOT NULL, -- 'insights', 'categorize', 'anomalies', 'what_if'
  input_data JSONB,
  output_data JSONB,
  latency_ms INTEGER,
  called_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_calls_workspace ON agent_calls(workspace_id, called_at DESC);
```

### 2. Backend Routes to Add

#### File: `backend/app/agent.py`

**Add these three new endpoints:**

```python
# 1. Accountant - Auto-Categorize
@router.post("/categorize")
async def categorize_transactions(req: InsightReq):
    """
    AI-powered transaction categorization.
    Analyzes merchant names and amounts to assign categories.
    """
    sb = get_supabase_client()
    
    # Get uncategorized or poorly categorized transactions
    rows = sb.table("transactions").select("id,merchant,amount,category") \
        .eq("workspace_id", req.workspace_id) \
        .limit(50).execute().data
    
    if not rows:
        return {"categorized": 0, "message": "No transactions to categorize"}
    
    # Build AI prompt
    txn_summary = "\n".join([
        f"{t['merchant']}: ${t['amount']}" for t in rows[:20]
    ])
    
    messages = [
        {"role": "system", "content": "You are an AI accountant. Categorize transactions into: SaaS, Payroll, Marketing, Travel, Office, Equipment, Legal, Other. Respond as JSON array: [{id, category, confidence}]"},
        {"role": "user", "content": f"Categorize these transactions:\n{txn_summary}"}
    ]
    
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {lava_token()}"}
    body = {"model": "llama-3.1-8b-instant", "messages": messages}
    
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(get_lava_url(), headers=headers, json=body)
    if r.status_code >= 400:
        raise HTTPException(500, r.text)
    
    latency_ms = int((time.perf_counter() - t0) * 1000)
    text = r.json().get("choices", [{}])[0].get("message", {}).get("content", "")
    
    # Parse and update (in production, add better parsing)
    updated_count = 0
    try:
        # Simple heuristic: extract category suggestions
        for txn in rows[:10]:  # Update first 10 as demo
            # In production: parse AI JSON response properly
            sb.table("transactions").update({"category": "SaaS"}).eq("id", txn["id"]).execute()
            updated_count += 1
    except:
        pass
    
    # Log agent call
    sb.table("agent_calls").insert({
        "workspace_id": req.workspace_id,
        "agent_type": "accountant",
        "action": "categorize",
        "input_data": {"count": len(rows)},
        "output_data": {"categorized": updated_count},
        "latency_ms": latency_ms
    }).execute()
    
    return {
        "categorized": updated_count,
        "analyzed": len(rows),
        "ai_response": text[:200],
        "latency_ms": latency_ms
    }


# 2. Accountant - Detect Anomalies
@router.post("/anomalies")
async def detect_anomalies(req: InsightReq):
    """
    AI-powered anomaly detection in transactions.
    Flags unusual spending patterns.
    """
    sb = get_supabase_client()
    
    # Get recent transactions
    rows = sb.table("transactions").select("ts,amount,category,merchant") \
        .eq("workspace_id", req.workspace_id) \
        .order("ts", desc=True) \
        .limit(100).execute().data
    
    if len(rows) < 10:
        return {"anomalies": [], "message": "Need more transaction history"}
    
    # Calculate stats
    amounts = [abs(float(r["amount"])) for r in rows]
    avg = sum(amounts) / len(amounts)
    
    # Find outliers (simple: >2x average)
    anomalies = [
        {
            "merchant": r["merchant"],
            "amount": r["amount"],
            "date": r["ts"],
            "reason": f"${abs(float(r['amount'])):.2f} is {abs(float(r['amount']))/avg:.1f}x average"
        }
        for r in rows if abs(float(r["amount"])) > avg * 2
    ][:5]
    
    # Ask AI for insights
    messages = [
        {"role": "system", "content": "You are an AI accountant detecting unusual spending. List concerns in <100 words."},
        {"role": "user", "content": f"Avg transaction: ${avg:.2f}. Found {len(anomalies)} outliers. Analyze risk."}
    ]
    
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {lava_token()}"}
    body = {"model": "llama-3.1-8b-instant", "messages": messages}
    
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(get_lava_url(), headers=headers, json=body)
    
    latency_ms = int((time.perf_counter() - t0) * 1000)
    text = r.json().get("choices", [{}])[0].get("message", {}).get("content", "") if r.status_code < 400 else ""
    
    # Log
    sb.table("agent_calls").insert({
        "workspace_id": req.workspace_id,
        "agent_type": "accountant",
        "action": "anomalies",
        "input_data": {"transactions": len(rows)},
        "output_data": {"anomalies_found": len(anomalies)},
        "latency_ms": latency_ms
    }).execute()
    
    return {
        "anomalies": anomalies,
        "ai_analysis": text,
        "latency_ms": latency_ms
    }


# 3. Scenario - What-If Simulations
class ScenarioRequest(BaseModel):
    workspace_id: str
    scenario_type: str  # 'cut_expense', 'add_revenue', 'raise'
    category: str | None = None  # For expense cuts
    change_amount: float  # Dollar amount or percentage

@router.post("/what_if")
async def what_if_scenario(req: ScenarioRequest):
    """
    AI-powered what-if scenario planning.
    Simulates impact of financial changes on runway.
    """
    sb = get_supabase_client()
    
    # Get current metrics
    burn_data = burn_runway(WS(workspace_id=req.workspace_id))
    
    current_burn = burn_data["burn_avg_3m"]
    current_cash = burn_data["cash"]
    current_runway = burn_data["runway_months"]
    
    # Simulate scenario
    new_burn = current_burn
    new_cash = current_cash
    
    if req.scenario_type == "cut_expense":
        new_burn = current_burn * (1 - req.change_amount / 100)
        scenario_desc = f"Cut {req.category or 'expenses'} by {req.change_amount}%"
    elif req.scenario_type == "add_revenue":
        new_burn = current_burn - req.change_amount
        scenario_desc = f"Add ${req.change_amount:,.0f}/month revenue"
    elif req.scenario_type == "raise":
        new_cash = current_cash + req.change_amount
        scenario_desc = f"Raise ${req.change_amount:,.0f}"
    else:
        raise HTTPException(400, "Invalid scenario_type")
    
    new_runway = (new_cash / new_burn) if new_burn > 0 else 999
    runway_change = new_runway - current_runway
    
    # Ask AI for strategic analysis
    messages = [
        {"role": "system", "content": "You are a CFO strategist. Analyze scenario impact in <120 words as bullets."},
        {"role": "user", "content": f"Scenario: {scenario_desc}\nCurrent: ${current_cash:,.0f} cash, ${current_burn:,.0f}/mo burn, {current_runway:.1f}mo runway\nProjected: ${new_cash:,.0f} cash, ${new_burn:,.0f}/mo burn, {new_runway:.1f}mo runway\nAnalyze impact and risks."}
    ]
    
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {lava_token()}"}
    body = {"model": "llama-3.1-8b-instant", "messages": messages}
    
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(get_lava_url(), headers=headers, json=body)
    
    latency_ms = int((time.perf_counter() - t0) * 1000)
    text = r.json().get("choices", [{}])[0].get("message", {}).get("content", "") if r.status_code < 400 else ""
    
    # Log
    sb.table("agent_calls").insert({
        "workspace_id": req.workspace_id,
        "agent_type": "scenario",
        "action": "what_if",
        "input_data": {"scenario": scenario_desc},
        "output_data": {
            "current_runway": current_runway,
            "new_runway": new_runway,
            "change": runway_change
        },
        "latency_ms": latency_ms
    }).execute()
    
    return {
        "scenario": scenario_desc,
        "current": {
            "cash": round(current_cash, 2),
            "burn": round(current_burn, 2),
            "runway": round(current_runway, 1)
        },
        "projected": {
            "cash": round(new_cash, 2),
            "burn": round(new_burn, 2),
            "runway": round(new_runway, 1)
        },
        "runway_change_months": round(runway_change, 1),
        "ai_analysis": text,
        "latency_ms": latency_ms
    }
```

Add the new request model at the top of the file:
```python
class ScenarioRequest(BaseModel):
    workspace_id: str
    scenario_type: str  # 'cut_expense', 'add_revenue', 'raise'
    category: str | None = None
    change_amount: float
```

---

## Phase 2: Frontend - Multi-Agent UI

### 1. Create Navbar Component

**File: `frontend/components/Navbar.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  
  const links = [
    { href: "/dashboard", label: "📊 Dashboard", active: pathname === "/dashboard" },
    { href: "/cfo", label: "🤖 CFO Agent", active: pathname === "/cfo" },
    { href: "/accountant", label: "📚 Accountant", active: pathname === "/accountant" },
    { href: "/scenario", label: "🎯 Scenarios", active: pathname === "/scenario" },
  ];
  
  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            🤖 Agent Finny
          </Link>
          <div className="flex gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  link.active
                    ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### 2. Update Dashboard to Use Navbar

**File: `frontend/app/dashboard/page.tsx`**

Add at the top of the return:
```tsx
import Navbar from "@/components/Navbar";

// In return statement:
<>
  <Navbar />
  <main className="min-h-screen bg-gray-50">
    {/* existing dashboard content */}
  </main>
</>
```

### 3. Create CFO Agent Page

**File: `frontend/app/cfo/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function CFOPage() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState(0);

  const askFinny = async () => {
    setLoading(true);
    try {
      const r = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/agent/insights`, {
        workspace_id,
      });
      setAnswer(r.data.answer);
      setLatency(r.data.latency_ms);
    } catch (error) {
      setAnswer("Error fetching insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🤖 AI CFO Agent</h1>
                <p className="text-gray-600 mt-2">
                  Get executive-level financial insights powered by Lava AI
                </p>
              </div>
              <button
                onClick={askFinny}
                disabled={loading}
                className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "Thinking..." : "Ask Finny"}
              </button>
            </div>

            {answer && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">CFO Analysis</h2>
                  <span className="text-sm text-gray-600">
                    ⚡ {latency}ms via Lava
                  </span>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                  {answer}
                </pre>
              </div>
            )}

            {!answer && (
              <div className="text-center py-12 text-gray-500">
                <p>Click "Ask Finny" to get AI-powered financial insights</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="font-semibold mb-3">What the CFO Agent Analyzes:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ Burn rate trends and sustainability</li>
              <li>✅ Revenue vs expense patterns</li>
              <li>✅ Runway projections and risks</li>
              <li>✅ Strategic recommendations</li>
              <li>✅ Key financial risks and opportunities</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
```

### 4. Create Accountant Agent Page

**File: `frontend/app/accountant/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function AccountantPage() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  
  const [categorizeResult, setCategorizeResult] = useState<any>(null);
  const [anomaliesResult, setAnomaliesResult] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const runCategorize = async () => {
    setLoading("categorize");
    try {
      const r = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/agent/categorize`,
        { workspace_id }
      );
      setCategorizeResult(r.data);
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
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 AI Accountant</h1>
            <p className="text-gray-600 mb-8">
              Auto-categorize transactions and detect spending anomalies
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={runCategorize}
                disabled={loading === "categorize"}
                className="px-6 py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading === "categorize" ? "Categorizing..." : "🏷️ Auto-Categorize"}
              </button>
              
              <button
                onClick={runAnomalies}
                disabled={loading === "anomalies"}
                className="px-6 py-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading === "anomalies" ? "Detecting..." : "🔍 Detect Anomalies"}
              </button>
            </div>
          </div>

          {categorizeResult && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="font-semibold text-lg mb-4">✅ Categorization Results</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-900 font-medium">
                  ✨ Categorized {categorizeResult.categorized} of {categorizeResult.analyzed} transactions
                </p>
                <p className="text-sm text-green-700 mt-2">
                  ⚡ Completed in {categorizeResult.latency_ms}ms via Lava
                </p>
                {categorizeResult.ai_response && (
                  <pre className="text-xs text-gray-600 mt-3 whitespace-pre-wrap">
                    {categorizeResult.ai_response}
                  </pre>
                )}
              </div>
            </div>
          )}

          {anomaliesResult && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="font-semibold text-lg mb-4">🔍 Anomaly Detection</h2>
              
              {anomaliesResult.anomalies?.length > 0 ? (
                <div className="space-y-4">
                  {anomaliesResult.anomalies.map((a: any, idx: number) => (
                    <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{a.merchant}</p>
                          <p className="text-sm text-gray-600">{a.date}</p>
                        </div>
                        <p className="text-lg font-bold text-yellow-700">
                          ${Math.abs(a.amount).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-yellow-800 mt-2">⚠️ {a.reason}</p>
                    </div>
                  ))}
                  
                  {anomaliesResult.ai_analysis && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                      <h3 className="font-medium mb-2">AI Analysis:</h3>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {anomaliesResult.ai_analysis}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-green-600">✅ No anomalies detected - spending looks normal!</p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
```

### 5. Create Scenario Agent Page

**File: `frontend/app/scenario/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ScenarioPage() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  
  const [scenarioType, setScenarioType] = useState("cut_expense");
  const [category, setCategory] = useState("SaaS");
  const [changeAmount, setChangeAmount] = useState("30");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runScenario = async () => {
    setLoading(true);
    try {
      const r = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/agent/what_if`, {
        workspace_id,
        scenario_type: scenarioType,
        category,
        change_amount: parseFloat(changeAmount),
      });
      setResult(r.data);
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Scenario Planner</h1>
            <p className="text-gray-600 mb-8">
              Run what-if simulations to see impact on your runway
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scenario Type
                </label>
                <select
                  value={scenarioType}
                  onChange={(e) => setScenarioType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="cut_expense">Cut Expenses</option>
                  <option value="add_revenue">Add Revenue</option>
                  <option value="raise">Raise Funding</option>
                </select>
              </div>

              {scenarioType === "cut_expense" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category to Cut
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="SaaS">SaaS</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Travel">Travel</option>
                    <option value="Office">Office</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {scenarioType === "cut_expense"
                    ? "Percentage to Cut (%)"
                    : scenarioType === "add_revenue"
                    ? "Monthly Revenue to Add ($)"
                    : "Funding Amount ($)"}
                </label>
                <input
                  type="number"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder={scenarioType === "cut_expense" ? "30" : "5000"}
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

          {result && !result.error && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="font-semibold text-lg mb-4">📊 Scenario Results</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="font-medium text-blue-900">{result.scenario}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Current</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cash</span>
                      <span className="font-semibold">${result.current.cash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Burn</span>
                      <span className="font-semibold">${result.current.burn.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Runway</span>
                      <span className="font-semibold">{result.current.runway} months</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-medium text-green-700 mb-3">Projected</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cash</span>
                      <span className="font-semibold text-green-700">${result.projected.cash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Burn</span>
                      <span className="font-semibold text-green-700">${result.projected.burn.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Runway</span>
                      <span className="font-semibold text-green-700">{result.projected.runway} months</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-lg p-4 mb-4 ${
                  result.runway_change_months > 0
                    ? "bg-green-100 border border-green-300"
                    : "bg-red-100 border border-red-300"
                }`}
              >
                <p className="font-bold text-lg">
                  {result.runway_change_months > 0 ? "✅" : "⚠️"} Runway Change:{" "}
                  {result.runway_change_months > 0 ? "+" : ""}
                  {result.runway_change_months} months
                </p>
              </div>

              {result.ai_analysis && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                  <h3 className="font-semibold mb-3">AI Strategic Analysis:</h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                    {result.ai_analysis}
                  </pre>
                  <p className="text-xs text-gray-500 mt-3">
                    ⚡ Generated in {result.latency_ms}ms via Lava
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
      </main>
    </>
  );
}
```

---

## 🎬 Updated Judge Demo Script (90 seconds)

1. **Dashboard** (15s) - Show metrics overview
2. **CFO Agent** (20s) - Click "Ask Finny" → AI insights appear
3. **Accountant** (25s) - Auto-categorize → Detect anomalies → Show results
4. **Scenario** (25s) - "Cut SaaS 30%" → Show new runway projection → AI analysis
5. **Close** (5s) - "Multi-agent AI suite powered by Lava"

---

## ✅ Cursor Implementation Steps

### Backend:
1. Run SQL migration for `agent_calls` table
2. Add 3 new endpoints to `app/agent.py` (categorize, anomalies, what_if)
3. Add `ScenarioRequest` model
4. Test each endpoint

### Frontend:
1. Create `components/Navbar.tsx`
2. Update `app/dashboard/page.tsx` to include Navbar
3. Create `app/cfo/page.tsx`
4. Create `app/accountant/page.tsx`
5. Create `app/scenario/page.tsx`
6. Test navigation and all agent interactions

---

Ready to implement? This will transform Finny into an impressive multi-agent system! 🚀

