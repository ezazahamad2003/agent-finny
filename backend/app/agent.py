# app/agent.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os, json, base64, httpx, time
from app.metrics import summary, burn_runway, WS

router = APIRouter(prefix="/agent", tags=["agent"])

def lava_token():
    payload = {
        "secret_key": os.environ["LAVA_API_KEY"],
        "connection_secret": os.environ["LAVA_SELF_CONNECTION_SECRET"],
        "product_secret": os.environ["LAVA_SELF_PRODUCT_SECRET"],
    }
    return base64.b64encode(json.dumps(payload).encode()).decode()

def get_lava_url():
    return os.environ["LAVA_FORWARD_URL"] + os.environ["AI_CHAT_URL"]

class InsightReq(BaseModel):
    workspace_id: str
    question: str | None = "Give a concise CFO summary and risks."

@router.post("/insights")
async def insights(req: InsightReq):
    s = summary(WS(workspace_id=req.workspace_id))
    b = burn_runway(WS(workspace_id=req.workspace_id))
    messages = [
      {"role":"system","content":"You are a startup CFO. Use the provided metrics. Respond in ≤120 words as bullet points."},
      {"role":"user","content": f"Metrics: {json.dumps({'summary':s,'burn':b})}\nTask: {req.question}"},
    ]

    headers = {"Content-Type":"application/json","Authorization":f"Bearer {lava_token()}"}
    body = {"model":"llama-3.1-8b-instant","messages":messages}

    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(get_lava_url(), headers=headers, json=body)
    if r.status_code >= 400:
        raise HTTPException(500, r.text)
    data = r.json()
    latency_ms = int((time.perf_counter()-t0)*1000)
    text = data.get("choices",[{}])[0].get("message",{}).get("content","")
    return {"answer": text, "latency_ms": latency_ms}

