# app/plaid.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

router = APIRouter(prefix="/plaid", tags=["plaid"])

class DemoItemRequest(BaseModel):
    workspace_id: str

class LinkTokenRequest(BaseModel):
    workspace_id: str

class ExchangeRequest(BaseModel):
    public_token: str
    workspace_id: str

# Lazy initialization - only access env vars when endpoint is called
def get_plaid_config():
    return {
        "base": "https://sandbox.plaid.com",
        "client_id": os.environ.get("PLAID_CLIENT_ID"),
        "secret": os.environ.get("PLAID_SECRET")
    }

def get_supabase_client():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise HTTPException(500, "Supabase credentials not configured")
    return create_client(url, key)

async def _post(path, payload, config):
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(f"{config['base']}{path}", json=payload)
    if r.status_code >= 400:
        raise HTTPException(500, f"Plaid API error: {r.text}")
    return r.json()

@router.post("/demo-item")
async def demo_item(request: DemoItemRequest):
    """
    Create a Plaid sandbox item and seed transactions into Supabase.
    
    This endpoint:
    1. Creates a fake bank connection using Plaid sandbox
    2. Exchanges public token for access token
    3. Fetches mock transactions
    4. Inserts transactions into Supabase
    
    Returns: {"inserted": count, "workspace_id": id}
    """
    workspace_id = request.workspace_id
    config = get_plaid_config()
    if not config["client_id"] or not config["secret"]:
        raise HTTPException(500, "Plaid credentials not configured. Set PLAID_CLIENT_ID and PLAID_SECRET in .env")
    
    sb = get_supabase_client()
    
    # 1) make a fake bank connection (public_token) with custom user for instant transactions
    print(f"[Plaid] Creating sandbox public token for workspace {workspace_id}...")
    pub = await _post("/sandbox/public_token/create", {
        "client_id": config["client_id"],
        "secret": config["secret"],
        "institution_id": "ins_109508",
        "initial_products": ["transactions"],
        "options": {
            "override_username": "user_good",
            "override_password": "pass_good"
        }
    }, config)
    
    # 2) exchange for access_token
    print("[Plaid] Exchanging public token for access token...")
    exch = await _post("/item/public_token/exchange", {
        "client_id": config["client_id"],
        "secret": config["secret"],
        "public_token": pub["public_token"]
    }, config)
    access_token = exch["access_token"]
    
    # 3) Fire transactions to populate sandbox data
    print("[Plaid] Firing sandbox transactions webhook...")
    try:
        await _post("/sandbox/item/fire_webhook", {
            "client_id": config["client_id"],
            "secret": config["secret"],
            "access_token": access_token,
            "webhook_code": "DEFAULT_UPDATE"
        }, config)
    except:
        pass  # Webhook may not be configured, that's okay
    
    # 4) fetch mock transactions (last ~120d)
    print("[Plaid] Fetching transactions...")
    tx = await _post("/transactions/get", {
        "client_id": config["client_id"],
        "secret": config["secret"],
        "access_token": access_token,
        "start_date": "2024-01-01",
        "end_date": "2025-10-31",
        "options": {"count": 500}
    }, config)
    
    # 5) transform → insert into Supabase
    rows = []
    for t in tx.get("transactions", []):
        amt = -float(t["amount"])  # expenses negative
        cat = (t.get("category") or ["Other"])[0]
        rows.append({
            "id": t["transaction_id"],
            "workspace_id": workspace_id,
            "ts": t["date"],
            "amount": amt,
            "category": cat,
            "merchant": t.get("name"),
            "note": "Plaid sandbox",
            "source": "plaid",
            "raw": t
        })
    
    if rows:
        print(f"[Supabase] Inserting {len(rows)} transactions...")
        sb.table("transactions").upsert(rows).execute()
        print(f"✓ Successfully inserted {len(rows)} transactions")
    
    return {"inserted": len(rows), "workspace_id": workspace_id}

@router.post("/link-token")
async def link_token(request: LinkTokenRequest):
    """
    Create a Plaid Link token for connecting a bank account.
    Used by frontend to initialize Plaid Link UI.
    """
    config = get_plaid_config()
    if not config["client_id"] or not config["secret"]:
        raise HTTPException(500, "Plaid credentials not configured")
    
    print(f"[Plaid] Creating link token for workspace {request.workspace_id}...")
    response = await _post("/link/token/create", {
        "client_id": config["client_id"],
        "secret": config["secret"],
        "client_name": "Agent Finny",
        "products": ["transactions"],
        "country_codes": ["US"],
        "language": "en",
        "user": {
            "client_user_id": request.workspace_id
        }
    }, config)
    
    return {"link_token": response["link_token"]}

@router.post("/exchange")
async def exchange(request: ExchangeRequest):
    """
    Exchange Plaid public_token for access_token and fetch transactions.
    Called after user successfully connects their bank via Plaid Link.
    """
    config = get_plaid_config()
    if not config["client_id"] or not config["secret"]:
        raise HTTPException(500, "Plaid credentials not configured")
    
    sb = get_supabase_client()
    
    # 1) Exchange public token for access token
    print(f"[Plaid] Exchanging public token for workspace {request.workspace_id}...")
    exch = await _post("/item/public_token/exchange", {
        "client_id": config["client_id"],
        "secret": config["secret"],
        "public_token": request.public_token
    }, config)
    access_token = exch["access_token"]
    
    # 2) Fire webhook to populate sandbox data (if sandbox)
    try:
        await _post("/sandbox/item/fire_webhook", {
            "client_id": config["client_id"],
            "secret": config["secret"],
            "access_token": access_token,
            "webhook_code": "DEFAULT_UPDATE"
        }, config)
    except:
        pass
    
    # 3) Fetch transactions
    print("[Plaid] Fetching transactions...")
    tx = await _post("/transactions/get", {
        "client_id": config["client_id"],
        "secret": config["secret"],
        "access_token": access_token,
        "start_date": "2024-01-01",
        "end_date": "2025-10-31",
        "options": {"count": 500}
    }, config)
    
    # 4) Transform and insert into Supabase
    rows = []
    for t in tx.get("transactions", []):
        amt = -float(t["amount"])
        cat = (t.get("category") or ["Other"])[0]
        rows.append({
            "id": t["transaction_id"],
            "workspace_id": request.workspace_id,
            "ts": t["date"],
            "amount": amt,
            "category": cat,
            "merchant": t.get("name"),
            "note": "Plaid Link",
            "source": "plaid",
            "raw": t
        })
    
    if rows:
        print(f"[Supabase] Inserting {len(rows)} transactions...")
        sb.table("transactions").upsert(rows).execute()
        print(f"✓ Successfully inserted {len(rows)} transactions")
    
    return {"inserted": len(rows), "workspace_id": request.workspace_id}

