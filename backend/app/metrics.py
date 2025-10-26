# app/metrics.py
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date, timedelta
from supabase import create_client
import os

router = APIRouter(prefix="/metrics", tags=["metrics"])
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE"])

class WS(BaseModel):
    workspace_id: str

@router.post("/summary")
def summary(req: WS):
    rows = sb.table("transactions").select("ts,amount,category") \
        .eq("workspace_id", req.workspace_id) \
        .gte("ts", (date.today()-timedelta(days=180)).isoformat()) \
        .order("ts", desc=False).execute().data

    by_month, top_map = {}, {}
    today = date.today()
    mtd = {"revenue":0.0,"expense":0.0,"net":0.0}
    ytd = {"revenue":0.0,"expense":0.0,"net":0.0}

    for t in rows:
        amt = float(t["amount"])
        ym = str(t["ts"])[:7]
        by_month.setdefault(ym, {"revenue":0.0,"expense":0.0})
        if amt >= 0:
            by_month[ym]["revenue"] += amt
            if str(t["ts"])[:7] == today.strftime("%Y-%m"): mtd["revenue"] += amt
            if str(t["ts"])[:4] == today.strftime("%Y"):   ytd["revenue"] += amt
        else:
            by_month[ym]["expense"] += -amt
            cat = t.get("category") or "Other"
            top_map[cat] = top_map.get(cat, 0.0) + (-amt)
            if str(t["ts"])[:7] == today.strftime("%Y-%m"): mtd["expense"] += -amt
            if str(t["ts"])[:4] == today.strftime("%Y"):   ytd["expense"] += -amt

    mtd["net"] = mtd["revenue"] - mtd["expense"]
    ytd["net"] = ytd["revenue"] - ytd["expense"]
    top = sorted([{"category":k,"amount":v} for k,v in top_map.items()],
                 key=lambda x: -x["amount"])[:5]

    return {
        "months": sorted(by_month.keys()),
        "by_month": by_month,
        "top_categories": top,
        "mtd": {k: round(v,2) for k,v in mtd.items()},
        "ytd": {k: round(v,2) for k,v in ytd.items()},
    }

@router.post("/burn_runway")
def burn_runway(req: WS):
    rows = sb.table("transactions").select("ts,amount") \
        .eq("workspace_id", req.workspace_id).execute().data

    month_map = {}
    for t in rows:
        ym = str(t["ts"])[:7]
        month_map.setdefault(ym, {"rev":0.0,"exp":0.0})
        amt = float(t["amount"])
        if amt >= 0: month_map[ym]["rev"] += amt
        else:        month_map[ym]["exp"] += -amt

    last3 = sorted(month_map.keys())[-3:]
    burns = [(month_map[m]["exp"] - month_map[m]["rev"]) for m in last3] or [0.0]
    burn_avg = max(sum(burns)/len(burns), 0.0)

    snap = sb.table("cash_snapshots").select("cash") \
        .eq("workspace_id", req.workspace_id) \
        .order("as_of", desc=True).limit(1).execute().data
    cash = float(snap[0]["cash"]) if snap else 25000.0
    runway = (cash / burn_avg) if burn_avg > 1e-6 else None

    return {"burn_avg_3m": round(burn_avg,2),
            "cash": round(cash,2),
            "runway_months": (round(runway,1) if runway else "∞")}

