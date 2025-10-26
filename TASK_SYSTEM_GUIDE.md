# FINNY AI Task System Guide

## Overview

The FINNY task system allows users to create tasks, generate AI-powered meetings with voice conversations, and automatically track progress with email notifications.

## Features

### 1. **Task Creation**
- **Task Name**: Required (e.g., "Catch up with investor")
- **Description**: Optional task details
- **Email**: Optional recipient for meeting link
- **Links**: Optional comma-separated URLs

### 2. **AI Meeting Flow**

```
User creates task → "Start Meeting" → Navigate to meeting page
                                               ↓
                                        AI conversation
                                               ↓
                                    "Complete" button
                                               ↓
                              Task marked done + Summary email
```

### 3. **Task Statuses**
- **TODO**: Initial state after creation
- **IN_PROGRESS**: Meeting started, waiting for completion
- **DONE**: Meeting completed, summary sent

## Backend Endpoints

### Create Task
```bash
POST /tasks/create
{
  "workspace_id": "uuid",
  "title": "Catch up with investor",
  "description": "Discuss funding options",
  "email": "investor@example.com",
  "links": ["https://example.com/pitch"]
}
```

### Start Meeting
```bash
POST /tasks/start-meeting/{task_id}
# Returns: { meeting_id, meeting_link }
# Updates task status to "in_progress"
```

### Complete Task
```bash
POST /tasks/complete/{task_id}
# Returns: { task_id, status: "done", summary }
# Marks task as done and sends summary email
```

### List Tasks
```bash
GET /tasks/list/{workspace_id}
# Returns: { tasks: [...], count: N }
```

### Get Meeting
```bash
GET /tasks/meeting/{meeting_id}
# Returns: { meeting_id, task, context }
```

## Frontend Pages

### `/tasks`
- Access restricted to authorized users
- Create tasks with form inputs
- View tasks in three columns: To Do, In Progress, Done
- Action buttons: "Start Meeting", "Complete"

### `/meet/[slug]`
- AI conversation interface
- Chat messages with FINNY AI
- Green circle avatar for AI
- Send text messages
- End meeting button

## Database Schema

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done')),
  email TEXT,
  links TEXT[],
  meeting_id UUID,
  meeting_link TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB
);
```

## Email Notifications (Fake/Mocked)

### Meeting Invitation
```
Subject: AI Meeting: {task_title}
Body: 
  Meeting Link: /meet/{meeting_id}
  Description: {task_description}
  
  Click the link to join the meeting with FINNY.
```

### Meeting Summary
```
Subject: Meeting Summary: {task_title}
Body:
  {AI-generated summary of conversation}
  
  Meeting Details:
  - Task: {task_title}
  - Status: Completed
```

## 11 Labs Voice Integration (Ready)

The system is designed to integrate with 11 Labs for:
- **Text-to-Speech**: Convert AI responses to voice
- **Speech-to-Text**: Transcribe user voice input
- **Voice Conversation**: Real-time voice chat with FINNY

Currently, the voice features are **simulated** but ready for production integration.

## Usage Flow

1. **Create Task**
   - Go to `/tasks` page
   - Click "+ Add Task"
   - Fill in task name, description, email, links
   - Click "Add Task"

2. **Start Meeting**
   - Click "Start Meeting" on a TODO task
   - Task moves to "In Progress"
   - Navigate to meeting page
   - Fake email sent to user with meeting link

3. **Converse with AI**
   - Type messages or use voice
   - FINNY responds with financial insights
   - Chat conversation continues

4. **Complete Task**
   - Click "Complete" button
   - Task moves to "Done"
   - Fake summary email sent
   - Dashboard updates with completion

## AI Avatar

Simple green circle with "F" letter - no avatar image needed.

## Next Steps

1. ✅ Run SQL to create `tasks` table in Supabase
2. ✅ Test task creation flow
3. ✅ Test meeting generation
4. ✅ Integrate real 11 Labs API
5. ✅ Implement actual email sending
6. ✅ Add real-time voice features

## Files Created

- `backend/app/tasks.py` - Task API endpoints
- `frontend/app/tasks/page.tsx` - Task management page
- `frontend/app/meet/[slug]/page.tsx` - Meeting conversation page
- `backend/TASKS_TABLE.sql` - Database schema
- `backend/RUN.md` - Backend setup guide
