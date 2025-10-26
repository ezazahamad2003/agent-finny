# 🤖 FINNY Multi-Agent Architecture

FINNY is powered by a modular, multi-agent AI system that handles voice interactions, meeting generation, and email automation.

## 📋 Agent Overview

| Agent | File | Description |
|-------|------|-------------|
| 🎯 **AgentTask** | `AgentTask.ts` | Parses user tasks and triggers appropriate agents |
| 🎤 **AgentVoice** | `AgentVoice.ts` | Generates voice audio and chat transcripts |
| 📅 **AgentMeeting** | `AgentMeeting.ts` | Creates meeting links and orchestrates sessions |
| 📧 **AgentGmail** | `AgentGmail.ts` | Handles email parsing and auto-responses |
| 📊 **AgentSummary** | `AgentSummary.ts` | Generates post-meeting summaries |
| 🧭 **AgentOrchestrator** | `AgentOrchestrator.ts` | Brain agent that coordinates all agents |

## 🔄 Workflow

```
User Task
    ↓
AgentTask (parse intent)
    ↓
AgentMeeting (create meeting link)
    ↓
AgentVoice (generate audio + script)
    ↓
[Meeting Session / Chat UI]
    ↓
AgentSummary (generate summary)
    ↓
AgentGmail (send follow-up email)
```

## 🚀 Usage

### Basic Task Creation

```typescript
import { AgentOrchestrator } from './agents/AgentOrchestrator';

const orchestrator = new AgentOrchestrator();
const result = await orchestrator.createTask({
  title: "Review Q4 Financials",
  description: "Analyze revenue trends and burn rate",
  email: "founder@startup.com"
});

console.log(result.meetingUrl); // /meet/abc123
```

### Voice Generation

```typescript
import { AgentVoice } from './agents/AgentVoice';

const voice = new AgentVoice();
const audio = await voice.generateScriptAndAudio({
  taskTitle: "Financial Review",
  taskDescription: "Q4 analysis",
  meetingType: "finance"
});
```

## 🔌 Integration Points

### Lava TTS/STT
- Configure in `.env`: `LAVA_API_KEY`, `LAVA_TTS_URL`
- See: `frontend/lib/lava.ts`

### Gmail API
- Configure in `.env`: `GMAIL_TOKEN`, `GMAIL_API_URL`
- See: `frontend/lib/email.ts`

### Supabase
- Meeting data stored in `meetings` table
- Summary data in `meeting_summaries` table

## 🎭 Demo Mode

All agents work in demo mode by default (logs instead of real API calls).

To enable production mode:
1. Set environment variables in `.env`
2. Deploy backend with real API keys
3. Agents will automatically use real APIs when configured

## 📖 Architecture Notes

- **Modular**: Each agent is a standalone class
- **Fake-able**: All external APIs have stub implementations
- **Traceable**: Every action is logged for debugging
- **Scalable**: Easy to add new agents or workflows
