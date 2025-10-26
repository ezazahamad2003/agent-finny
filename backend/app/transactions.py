from fastapi import APIRouter, Query
from supabase import create_client
import os

router = APIRouter(prefix="/transactions", tags=["transactions"])
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE"])

@router.get("/list")
async def list_transactions(
    workspace_id: str = Query(...),
    limit: int = Query(100, le=500),
    category: str = Query(None),
    days: int = Query(60)
):
    """
    Fetch recent transactions for a workspace.
    Optionally filter by category and time range.
    """
    print(f"[Transactions] Fetching transactions for workspace {workspace_id} (limit: {limit}, days: {days})")
    
    try:
        # Build query
        query = sb.table("transactions").select("*").eq("workspace_id", workspace_id)
        
        # Filter by category if provided
        if category and category.lower() != "all":
            query = query.eq("category", category)
        
        # Order by date descending and limit
        query = query.order("ts", desc=True).limit(limit)
        
        response = query.execute()
        transactions = response.data or []
        
        print(f"[Transactions] Found {len(transactions)} transactions")
        
        # Get unique categories for filter dropdown
        cat_query = sb.table("transactions")\
            .select("category")\
            .eq("workspace_id", workspace_id)\
            .order("category")
        
        cat_response = cat_query.execute()
        categories = list(set([t["category"] for t in (cat_response.data or []) if t.get("category")]))
        categories.sort()
        
        return {
            "transactions": transactions,
            "count": len(transactions),
            "categories": categories
        }
    except Exception as e:
        print(f"[Transactions] Error: {e}")
        return {"transactions": [], "count": 0, "categories": [], "error": str(e)}

