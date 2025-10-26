# app/agent.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from supabase import create_client
import os, json, base64, httpx, time
from datetime import date, timedelta
from app.metrics import summary, burn_runway, WS
from app.vector_db import vector_db

router = APIRouter(prefix="/agent", tags=["agent"])

# Supabase client
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE"])

def lava_token():
    payload = {
        "secret_key": os.environ["LAVA_API_KEY"],
        "connection_secret": os.environ["LAVA_SELF_CONNECTION_SECRET"],
        "product_secret": os.environ["LAVA_SELF_PRODUCT_SECRET"],
    }
    return base64.b64encode(json.dumps(payload).encode()).decode()

def get_lava_url():
    return os.environ["LAVA_FORWARD_URL"] + os.environ["AI_CHAT_URL"]

# Request Models
class InsightReq(BaseModel):
    workspace_id: str
    question: str | None = "Give a concise CFO summary and risks."

class CategorizeReq(BaseModel):
    workspace_id: str
    limit: int = 40

class AnomaliesReq(BaseModel):
    workspace_id: str

class WhatIfReq(BaseModel):
    workspace_id: str
    raise_amount: float | None = None
    cuts: list[dict] | None = None  # [{"category": "SaaS", "delta_pct": -30}]
    revenue_growth_pct: float | None = None

# 1. CFO Agent - Insights (Updated with JSON format)
@router.post("/insights")
async def insights(req: InsightReq):
    """CFO Agent: Financial insights with structured JSON output"""
    s = summary(WS(workspace_id=req.workspace_id))
    b = burn_runway(WS(workspace_id=req.workspace_id))
    
    messages = [
        {"role":"system","content":"You are an experienced startup CFO with 15+ years at high-growth companies. Analyze financial metrics and provide executive-level insights. Respond as JSON with keys: summary_bullets (array of 3-4 strategic insights), risks (array of 2-3 critical financial risks with severity), suggested_actions (array of 3-4 specific, actionable recommendations with expected impact). Be direct, data-driven, and focus on runway extension and growth."},
        {"role":"user","content": f"Financial Snapshot:\n- Monthly Burn: ${b['burn_avg_3m']:,.0f}\n- Cash Balance: ${b['cash']:,.0f}\n- Runway: {b['runway_months']} months\n- MTD Revenue: ${s['mtd']['revenue']:,.0f}\n- MTD Expenses: ${s['mtd']['expense']:,.0f}\n- YTD Net: ${s['ytd']['net']:,.0f}\n\nProvide strategic CFO analysis focusing on: 1) Financial health assessment, 2) Critical risks to runway, 3) Immediate actions to extend runway or accelerate growth."},
    ]

    headers = {"Content-Type":"application/json","Authorization":f"Bearer {lava_token()}"}
    body = {
        "model":"llama-3.1-8b-instant",
        "messages":messages,
        "response_format": {"type": "json_object"}
    }

    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(get_lava_url(), headers=headers, json=body)
    if r.status_code >= 400:
        raise HTTPException(500, r.text)
    
    data = r.json()
    latency_ms = int((time.perf_counter()-t0)*1000)
    content = data.get("choices",[{}])[0].get("message",{}).get("content","")
    
    try:
        parsed = json.loads(content)
    except:
        parsed = {"summary_bullets": [content], "risks": [], "suggested_actions": []}
    
    # Log to agent_calls
    sb.table("agent_calls").insert({
        "workspace_id": req.workspace_id,
        "agent_name": "cfo_insights",
        "input": {"question": req.question},
        "output": {"result": parsed, "latency_ms": latency_ms}
    }).execute()
    
    return {**parsed, "latency_ms": latency_ms}

# 2. Accountant Agent - Categorize
@router.post("/categorize")
async def categorize(req: CategorizeReq):
    """Accountant Agent: Auto-categorize transactions"""
    
    # Get uncategorized or "Other" transactions
    rows = sb.table("transactions").select("id,merchant,amount,category") \
        .eq("workspace_id", req.workspace_id) \
        .in_("category", ["Other", "Uncategorized", ""]) \
        .limit(req.limit).execute().data
    
    if not rows:
        return {"categorized": 0, "message": "No transactions need categorization"}
    
    # Build prompt
    txn_list = "\n".join([f"{t['id'][:8]}: {t['merchant']} ${t['amount']}" for t in rows[:20]])
    
    messages = [
        {"role":"system","content":"You are a senior accountant specializing in startup expense categorization. Analyze merchant names and amounts to categorize accurately. Use these categories: SaaS (software subscriptions), Payroll (salaries, benefits), Marketing (ads, campaigns, tools), Travel (flights, hotels, meals), Office (rent, utilities, supplies), Equipment (computers, furniture), Legal (attorneys, compliance), Meals (team meals, entertainment), Other (miscellaneous). Be consistent: recurring charges to tech companies are usually SaaS, one-time large purchases are Equipment. Respond as JSON: {categories: [{id: string (first 8 chars), category: string, confidence: string (high/medium/low)}]}"},
        {"role":"user","content": f"Categorize these {len(rows)} transactions. For each, provide the transaction ID (first 8 characters), most likely category, and confidence level:\n\n{txn_list}\n\nExamples:\n- 'Stripe' or 'AWS' = SaaS\n- 'Gusto' or 'ADP' = Payroll\n- 'Google Ads' = Marketing\n- 'United Airlines' = Travel\n- 'Dell' or 'Apple Store' (high $) = Equipment"}
    ]

    headers = {"Content-Type":"application/json","Authorization":f"Bearer {lava_token()}"}
    body = {
        "model":"llama-3.1-8b-instant",
        "messages":messages,
        "response_format": {"type": "json_object"}
    }

    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(get_lava_url(), headers=headers, json=body)
    
    latency_ms = int((time.perf_counter()-t0)*1000)
    
    if r.status_code >= 400:
        raise HTTPException(500, r.text)
    
    content = r.json().get("choices",[{}])[0].get("message",{}).get("content","")
    
    try:
        result = json.loads(content)
        categories_map = {item["id"]: item["category"] for item in result.get("categories", [])}
    except:
        categories_map = {}
    
    # Update transactions
    updated = 0
    for txn in rows:
        txn_id_short = txn["id"][:8]
        if txn_id_short in categories_map:
            cat = categories_map[txn_id_short]
            sb.table("transactions").update({"category": cat}).eq("id", txn["id"]).execute()
            updated += 1
    
    # Log
    sb.table("agent_calls").insert({
        "workspace_id": req.workspace_id,
        "agent_name": "accountant_categorize",
        "input": {"limit": req.limit, "found": len(rows)},
        "output": {"categorized": updated, "latency_ms": latency_ms}
    }).execute()
    
    return {
        "categorized": updated,
        "analyzed": len(rows),
        "latency_ms": latency_ms
    }

# 3. Accountant Agent - Detect Anomalies
@router.post("/anomalies")
async def anomalies(req: AnomaliesReq):
    """Accountant Agent: Detect spending anomalies"""
    
    # Get last 90 days of transactions
    start_date = (date.today() - timedelta(days=90)).isoformat()
    rows = sb.table("transactions").select("ts,amount,category,merchant") \
        .eq("workspace_id", req.workspace_id) \
        .gte("ts", start_date) \
        .order("ts", desc=True).execute().data
    
    if len(rows) < 10:
        return {"alerts": [], "explanation": "Need more transaction history"}
    
    # Calculate category spending
    cat_spend = {}
    for r in rows:
        if float(r["amount"]) < 0:  # Only expenses
            cat = r.get("category") or "Other"
            cat_spend[cat] = cat_spend.get(cat, 0) + abs(float(r["amount"]))
    
    # Calculate overall stats
    amounts = [abs(float(r["amount"])) for r in rows if float(r["amount"]) < 0]
    if not amounts:
        return {"alerts": [], "explanation": "No expenses found"}
    
    avg = sum(amounts) / len(amounts)
    
    # Find top outliers (>2x average)
    outliers = [
        {
            "title": f"Large {r['category'] or 'Other'} expense",
            "entity": r["merchant"],
            "delta": f"${abs(float(r['amount'])):.2f}",
            "why": f"{abs(float(r['amount']))/avg:.1f}x average transaction",
            "urgency": "high" if abs(float(r["amount"])) > avg * 3 else "medium"
        }
        for r in rows 
        if float(r["amount"]) < 0 and abs(float(r["amount"])) > avg * 2
    ][:3]
    
    # Ask AI for analysis
    outliers_str = ', '.join([f'${abs(float(o.get("delta", 0)))}' for o in outliers[:3]])
    messages = [
        {"role":"system","content":"You are a financial risk analyst specializing in spend management. Identify unusual patterns and assess their impact on runway and budget. Provide concise risk assessment in <100 words focusing on: 1) Whether anomalies are concerning or expected (one-time equipment purchases vs recurring waste), 2) Potential impact on monthly burn rate, 3) Specific recommendation to investigate or optimize."},
        {"role":"user","content": f"Anomaly Analysis:\n- Found {len(outliers)} outlier transactions (>2x average)\n- Average transaction: ${avg:.2f}\n- Total monthly spend by category: {json.dumps(cat_spend)}\n- Largest outliers: {outliers_str}\n\nAssess: Are these anomalies concerning (recurring waste, fraud) or expected (one-time investments)? What's the risk to runway?"}
    ]

    headers = {"Content-Type":"application/json","Authorization":f"Bearer {lava_token()}"}
    body = {"model":"llama-3.1-8b-instant","messages":messages}

    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(get_lava_url(), headers=headers, json=body)
    
    latency_ms = int((time.perf_counter()-t0)*1000)
    explanation = r.json().get("choices",[{}])[0].get("message",{}).get("content","") if r.status_code < 400 else "Analysis unavailable"
    
    # Log
    sb.table("agent_calls").insert({
        "workspace_id": req.workspace_id,
        "agent_name": "accountant_anomalies",
        "input": {"transactions": len(rows)},
        "output": {"alerts": len(outliers), "latency_ms": latency_ms}
    }).execute()
    
    return {
        "alerts": outliers,
        "explanation": explanation,
        "latency_ms": latency_ms
    }

# 4. CFO Agent - What-If Scenarios
@router.post("/what_if")
async def what_if(req: WhatIfReq):
    """CFO Agent: Scenario planning and projections"""
    
    # Get current metrics
    b = burn_runway(WS(workspace_id=req.workspace_id))
    current_burn = b["burn_avg_3m"]
    current_cash = b["cash"]
    current_runway = b["runway_months"]
    
    # Apply scenario changes
    new_burn = current_burn
    new_cash = current_cash
    scenario_desc = []
    
    if req.raise_amount:
        new_cash += req.raise_amount
        scenario_desc.append(f"Raise ${req.raise_amount:,.0f}")
    
    if req.cuts:
        for cut in req.cuts:
            reduction = current_burn * (abs(cut.get("delta_pct", 0)) / 100)
            new_burn -= reduction
            scenario_desc.append(f"Cut {cut.get('category', 'expenses')} by {abs(cut.get('delta_pct', 0))}%")
    
    if req.revenue_growth_pct:
        revenue_impact = current_burn * (req.revenue_growth_pct / 100)
        new_burn -= revenue_impact
        scenario_desc.append(f"Add {req.revenue_growth_pct}% revenue growth")
    
    new_runway = (new_cash / new_burn) if new_burn > 0.01 else 999
    scenario_text = ", ".join(scenario_desc) if scenario_desc else "No changes"
    
    # Calculate runway change
    runway_change = new_runway - current_runway if new_runway < 999 else 999
    
    # Ask AI for strategic analysis
    runway_change_desc = f"+{runway_change:.1f}" if runway_change > 0 else f"{runway_change:.1f}"
    messages = [
        {"role":"system","content":"You are a strategic CFO advisor. Analyze financial scenarios and provide executive-level guidance. Respond as JSON with keys: summary (2-3 sentence overview of impact), risks (array of 2-3 potential risks or downsides), recommendations (array of 2-3 specific next steps to maximize scenario success). Focus on practicality and execution. Be direct about trade-offs."},
        {"role":"user","content": f"Scenario Analysis: {scenario_text}\n\nCurrent State:\n- Cash: ${current_cash:,.0f}\n- Monthly Burn: ${current_burn:,.0f}\n- Runway: {current_runway:.1f} months\n\nProjected State:\n- Cash: ${new_cash:,.0f}\n- Monthly Burn: ${new_burn:,.0f}\n- Runway: {new_runway:.1f} months\n- Runway Change: {runway_change_desc} months\n\nProvide strategic analysis: 1) Is this scenario realistic and achievable? 2) What are the key risks or trade-offs? 3) What specific actions should leadership take to execute this successfully? Be honest about difficulty and timeline."}
    ]

    headers = {"Content-Type":"application/json","Authorization":f"Bearer {lava_token()}"}
    body = {
        "model":"llama-3.1-8b-instant",
        "messages":messages,
        "response_format": {"type": "json_object"}
    }

    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(get_lava_url(), headers=headers, json=body)
    
    latency_ms = int((time.perf_counter()-t0)*1000)
    
    try:
        content = r.json().get("choices",[{}])[0].get("message",{}).get("content","")
        analysis = json.loads(content)
        explanation = analysis.get("summary", content)
    except:
        explanation = "Analysis unavailable"
    
    # Log
    sb.table("agent_calls").insert({
        "workspace_id": req.workspace_id,
        "agent_name": "cfo_scenario",
        "input": {"scenario": scenario_text},
        "output": {
            "new_runway": round(new_runway, 1),
            "change_months": round(new_runway - current_runway, 1),
            "latency_ms": latency_ms
        }
    }).execute()
    
    return {
        "scenario": scenario_text,
        "new_burn": round(new_burn, 2),
        "new_cash": round(new_cash, 2),
        "runway_months": round(new_runway, 1) if new_runway < 999 else "∞",
        "runway_change": round(new_runway - current_runway, 1),
        "explanation": explanation,
        "latency_ms": latency_ms
    }

# 5. Accounting Agent - Comprehensive Insights
class AccountingReq(BaseModel):
    workspace_id: str

@router.post("/accounting-insights")
async def accounting_insights(req: AccountingReq):
    """
    Accounting Agent: Analyze transactions, categories, P&L, and provide 
    CFO-level insights on spending patterns, anomalies, and optimization opportunities.
    """
    print(f"[Accounting Agent] Generating insights for workspace {req.workspace_id}")
    
    # Get metrics
    s = summary(WS(workspace_id=req.workspace_id))
    b = burn_runway(WS(workspace_id=req.workspace_id))
    
    # Get recent transactions
    txns = sb.table("transactions").select("*")\
        .eq("workspace_id", req.workspace_id)\
        .order("ts", desc=True)\
        .limit(100).execute().data or []
    
    # Calculate category breakdown
    cat_totals = {}
    for t in txns:
        cat = t.get("category", "Other")
        cat_totals[cat] = cat_totals.get(cat, 0) + abs(t.get("amount", 0))
    
    top_cats = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Build context for AI
    context = f"""
FINANCIAL DATA SUMMARY:
- Cash Balance: ${b.get("cash", 0):,.2f}
- Monthly Burn Rate: ${b.get("burn_avg_3m", 0):,.2f}
- Runway: {b.get("runway_months", "∞")} months

PROFIT & LOSS (MTD):
- Revenue: ${s.get("mtd", {}).get("revenue", 0):,.2f}
- Expenses: ${s.get("mtd", {}).get("expense", 0):,.2f}
- Net: ${s.get("mtd", {}).get("net", 0):,.2f}

PROFIT & LOSS (YTD):
- Revenue: ${s.get("ytd", {}).get("revenue", 0):,.2f}
- Expenses: ${s.get("ytd", {}).get("expense", 0):,.2f}
- Net: ${s.get("ytd", {}).get("net", 0):,.2f}

TOP 5 EXPENSE CATEGORIES:
{chr(10).join([f"- {cat}: ${amt:,.2f}" for cat, amt in top_cats])}

RECENT TRANSACTIONS: {len(txns)} transactions analyzed
"""

    messages = [
        {
            "role": "system",
            "content": """You are FINNY, an elite AI CFO and accounting analyst.

Your task: Analyze financial data and provide professional, actionable accounting insights.

Response format:
1. **P&L Analysis** - Interpret profit & loss trends, highlight red flags
2. **Spending Patterns** - Identify where money is going, flag unusual patterns
3. **Optimization Opportunities** - 3-4 specific cost-cutting or efficiency recommendations
4. **Risk Assessment** - Financial risks based on burn rate, runway, and spending velocity

Style:
- Professional, concise, CFO-level language
- Use bullet points for clarity
- Include specific numbers and percentages
- Be direct about problems, constructive with solutions
- Prioritize actionable insights over generic advice"""
        },
        {
            "role": "user",
            "content": f"Analyze this startup's accounting data and provide comprehensive CFO insights:\n\n{context}"
        }
    ]
    
    start_time = time.time()
    
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(
            get_lava_url(),
            headers={
                "Authorization": f"Bearer {lava_token()}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1000
            }
        )
        
        if r.status_code >= 400:
            raise HTTPException(500, f"Lava error: {r.text}")
        
        data = r.json()
        answer = data["choices"][0]["message"]["content"].strip()
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    # Log to agent_calls
    sb.table("agent_calls").insert({
        "workspace_id": req.workspace_id,
        "agent_name": "accounting_insights",
        "input": {"metrics": {"cash": b.get("cash"), "burn": b.get("burn_avg_3m"), "runway": b.get("runway_months")}},
        "output": {"answer": answer[:500], "latency_ms": latency_ms}
    }).execute()
    
    return {
        "insights": answer,
        "summary": {
            "total_transactions": len(txns),
            "cash": b.get("cash", 0),
            "burn_rate": b.get("burn_avg_3m", 0),
            "runway_months": b.get("runway_months", "∞"),
            "mtd_revenue": s.get("mtd", {}).get("revenue", 0),
            "mtd_expense": s.get("mtd", {}).get("expense", 0),
            "mtd_net": s.get("mtd", {}).get("net", 0),
            "top_categories": [{"category": c, "amount": a} for c, a in top_cats]
        },
        "latency_ms": latency_ms
    }

# 6. Activity Feed
@router.get("/activity")
async def activity(
    workspace_id: str = Query(...),
    limit: int = Query(20, le=100)
):
    """Get recent agent activity log"""
    
    calls = sb.table("agent_calls").select("*") \
        .eq("workspace_id", workspace_id) \
        .order("created_at", desc=True) \
        .limit(limit).execute().data
    
    return {"activity": calls, "count": len(calls)}

