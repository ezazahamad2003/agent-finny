# app/tasks.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client
import os
import json
import uuid
from datetime import datetime
import httpx
import base64
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Supabase client
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE"])

def lava_token():
    """Generate Lava authentication token"""
    payload = {
        "secret_key": os.environ["LAVA_API_KEY"],
        "connection_secret": os.environ["LAVA_SELF_CONNECTION_SECRET"],
        "product_secret": os.environ["LAVA_SELF_PRODUCT_SECRET"],
    }
    return base64.b64encode(json.dumps(payload).encode()).decode()

def get_lava_url():
    """Get Lava API URL"""
    return os.environ["LAVA_FORWARD_URL"] + os.environ["AI_CHAT_URL"]

# Request Models
class CreateTaskRequest(BaseModel):
    workspace_id: str
    title: str
    description: str
    email: str | None = None
    links: list[str] | None = None

class UpdateTaskStatusRequest(BaseModel):
    task_id: str
    status: str

@router.post("/create")
async def create_task(req: CreateTaskRequest):
    """Create a new task and generate AI meeting"""
    
    # Create task in Supabase
    task = {
        "id": str(uuid.uuid4()),
        "workspace_id": req.workspace_id,
        "title": req.title,
        "description": req.description,
        "status": "todo",
        "email": req.email,
        "links": req.links or [],
        "created_at": datetime.utcnow().isoformat()
    }
    
    sb.table("tasks").insert(task).execute()
    
    return {"task": task, "message": "Task created successfully"}

@router.post("/start-meeting/{task_id}")
async def start_meeting(task_id: str):
    """Generate AI meeting link and send email"""
    
    # Get task
    task_data = sb.table("tasks").select("*").eq("id", task_id).execute()
    
    if not task_data.data:
        raise HTTPException(404, "Task not found")
    
    task = task_data.data[0]
    email = task.get("email")
    
    if not email:
        raise HTTPException(400, "Task has no email address")
    
    # Generate meeting ID and link
    meeting_id = str(uuid.uuid4())
    meeting_link = f"/meet/{meeting_id}"
    
    # Update task status to "in_progress"
    sb.table("tasks").update({
        "status": "in_progress",
        "meeting_id": meeting_id,
        "meeting_link": meeting_link
    }).eq("id", task_id).execute()
    
    # Send email with meeting link
    email_subject = f"AI Meeting: {task['title']}"
    email_body = f"""
Hi there!

You have an upcoming AI meeting for: {task['title']}

Meeting Link: {meeting_link}
Description: {task['description']}

Click the link above to join the meeting with FINNY, your AI CFO assistant.

Best,
FINNY Team
    """
    
    # TODO: Send actual email
    print(f"📧 Email would be sent to {email}")
    
    return {
        "meeting_id": meeting_id,
        "meeting_link": meeting_link,
        "message": "Meeting started, email sent"
    }

@router.post("/complete/{task_id}")
async def complete_task(task_id: str):
    """Mark task as done and send summary email"""
    
    # Get task
    task_data = sb.table("tasks").select("*").eq("id", task_id).execute()
    
    if not task_data.data:
        raise HTTPException(404, "Task not found")
    
    task = task_data.data[0]
    email = task.get("email")
    
    # Update task status
    sb.table("tasks").update({
        "status": "done",
        "completed_at": datetime.utcnow().isoformat()
    }).eq("id", task_id).execute()
    
    # Generate meeting summary (mock for now)
    summary = f"""
Meeting Summary for: {task['title']}

Key Points Discussed:
- Financial health assessment
- Burn rate optimization opportunities
- Runway extension strategies
- Revenue growth recommendations

Action Items:
- Review and implement cost-cutting measures
- Monitor monthly burn rate
- Schedule follow-up meeting

Next Steps:
- Continue tracking financial metrics
- Set up automated alerts
    """
    
    # Send summary email
    if email:
        email_subject = f"Meeting Summary: {task['title']}"
        email_body = f"""
Hi there!

Here's the summary of your AI meeting:

{summary}

Meeting Details:
- Task: {task['title']}
- Status: Completed

Best,
FINNY Team
        """
        
        # TODO: Send actual email
        print(f"📧 Summary email would be sent to {email}")
    
    return {
        "task_id": task_id,
        "status": "done",
        "summary": summary,
        "message": "Task completed, summary sent"
    }

@router.get("/list/{workspace_id}")
async def list_tasks(workspace_id: str):
    """List all tasks for a workspace"""
    
    tasks = sb.table("tasks").select("*").eq("workspace_id", workspace_id).order("created_at", desc=True).execute()
    
    return {
        "tasks": tasks.data,
        "count": len(tasks.data)
    }

@router.get("/meeting/{meeting_id}")
async def get_meeting(meeting_id: str):
    """Get meeting details"""
    
    task_data = sb.table("tasks").select("*").eq("meeting_id", meeting_id).execute()
    
    if not task_data.data:
        raise HTTPException(404, "Meeting not found")
    
    task = task_data.data[0]
    
    # Generate meeting context
    context = {
        "task_title": task["title"],
        "task_description": task["description"],
        "workspace_id": task["workspace_id"]
    }
    
    return {
        "meeting_id": meeting_id,
        "task": task,
        "context": context
    }
