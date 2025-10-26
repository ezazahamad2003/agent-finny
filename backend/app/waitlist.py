from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client
import os

router = APIRouter(prefix="/waitlist", tags=["waitlist"])

# Lazy load Supabase client
def get_supabase_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise HTTPException(500, "Supabase credentials not configured")
    return create_client(url, key)

class WaitlistRequest(BaseModel):
    startup_name: str
    email: EmailStr

@router.post("/join")
async def join_waitlist(req: WaitlistRequest):
    """Add a new entry to the waitlist"""
    sb = get_supabase_client()
    
    try:
        # Check if email already exists
        existing = sb.table("waitlist").select("email").eq("email", req.email).execute()
        
        if existing.data:
            return {
                "success": False,
                "message": "This email is already on the waitlist!",
                "already_exists": True
            }
        
        # Insert new waitlist entry
        result = sb.table("waitlist").insert({
            "startup_name": req.startup_name,
            "email": req.email
        }).execute()
        
        print(f"[Waitlist] Added: {req.startup_name} ({req.email})")
        
        return {
            "success": True,
            "message": f"Thanks for joining, {req.startup_name}! We'll reach out to {req.email} soon.",
            "data": result.data[0] if result.data else None
        }
        
    except Exception as e:
        print(f"[Waitlist Error] {str(e)}")
        raise HTTPException(500, f"Failed to add to waitlist: {str(e)}")

@router.get("/count")
async def get_waitlist_count():
    """Get total number of waitlist signups"""
    sb = get_supabase_client()
    
    try:
        result = sb.table("waitlist").select("id", count="exact").execute()
        return {"count": result.count}
    except Exception as e:
        raise HTTPException(500, f"Failed to get count: {str(e)}")

