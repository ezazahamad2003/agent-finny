# FINNY MCP Agent Integration Summary

## What Was Added

This update integrates **Redis Vector Database** and **Lava Voice (TTS/STT)** into the FINNY multi-agent system, enabling advanced contextual AI and voice interactions.

## 🔴 Redis Vector Database

### Purpose
- **Semantic Search**: Store and retrieve financial context with vector similarity
- **Context-Aware Agents**: LLM agents get relevant historical insights
- **Memory**: Persistent storage of financial patterns and insights

### How It Works

```python
# 1. Store financial context
vector_db.add_financial_context(
    workspace_id="workspace-123",
    context_type="metric",
    content="Burn rate increased 20% MoM"
)

# 2. Search for relevant context
results = vector_db.search(
    query="What caused the burn increase?",
    workspace_id="workspace-123",
    top_k=3
)

# 3. Agents use context for better insights
context = vector_db.get_context_for_query(workspace_id, query)
```

### Technologies
- **Redis 7+** with RediSearch module
- **OpenAI Ada-002** for embeddings (1536-dimensional vectors)
- **Cosine similarity** for semantic search

## 🎤 Lava TTS/STT Integration

### Purpose
- **Voice Generation**: Convert AI insights to natural speech
- **Meeting Experience**: Voice-based financial briefings
- **Interactive Audio**: Chunked audio for smooth playback

### How It Works

```python
# Generate speech from text
result = await lava_voice.text_to_speech(
    text="Your burn rate is $11.1k per month",
    voice="alloy",  # Professional voice
    speed=1.0
)

# Returns audio_base64, duration, audio_url
```

### API Endpoints

**POST `/voice/tts`**
- Convert text to speech
- Returns audio URL and metadata

**POST `/voice/tts-stream`**
- Stream audio directly as MP3
- For direct playback

**POST `/voice/tts-chunks`**
- Generate speech in chunks
- Better for long-form content
- Each chunk has timing info

### Technologies
- **Lava Payments API**: Proxy for AI services
- **OpenAI TTS**: Text-to-speech model (tts-1)
- **6 Voice Models**: alloy, echo, fable, onyx, nova, shimmer

## 📊 Agent Integration

### Before (Without Vector DB)
```python
# Agents only saw current metrics
messages = [
    {"role": "user", "content": f"Burn: ${burn}"}
]
```

### After (With Vector DB)
```python
# Agents get historical context
context = vector_db.get_context_for_query(
    workspace_id=workspace_id,
    query="burn rate trends"
)

messages = [
    {"role": "system", "content": f"Context: {context}"},
    {"role": "user", "content": f"Current burn: ${burn}"}
]
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           User Query                        │
│  "What's our financial health?"             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         Agent Orhestrator                   │
└────────┬────────────────────────────────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│ Vector Search│  │   TTS Voice  │
│   (Redis)    │  │   (Lava)     │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Embeddings   │  │  Audio File  │
│  (OpenAI)    │  │  (OpenAI TTS)│
└──────────────┘  └──────────────┘
```

## 🚀 Setup Required

### 1. Install Redis
```bash
# Docker (easiest)
docker run -d -p 6379:6379 redis/redis-stack:latest
```

### 2. Environment Variables
Add to `.env`:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

OPENAI_API_KEY=sk-...
```

### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

## 📝 Files Added

- `backend/app/vector_db.py` - Vector database integration
- `backend/app/lava_voice.py` - Lava TTS/STT service
- `backend/app/voice.py` - Voice API endpoints
- `REDIS_SETUP.md` - Complete setup guide

## 🎯 Use Cases

### 1. Context-Aware CFO Insights
```python
# Agent remembers past recommendations
context = vector_db.search(
    query="What did we recommend last month?",
    workspace_id=workspace_id
)
```

### 2. Voice Financial Briefings
```python
# Generate voice summary
audio = await voice.text_to_speech(
    text="Your runway is 4.3 months...",
    voice="nova"
)
```

### 3. Semantic Transaction Search
```python
# Find similar transactions
similar = vector_db.search(
    query="large SaaS subscription",
    workspace_id=workspace_id
)
```

## ⚙️ Configuration

All services support graceful degradation:
- If Redis is down, agents work without vector context
- If Lava is down, voice features are disabled
- If OpenAI is down, embeddings use fallback

## 🔜 Next Steps

1. **Frontend Voice Integration**: Add audio playback to meeting pages
2. **STT Implementation**: Enable voice input for queries
3. **Context Caching**: Cache frequently accessed contexts
4. **Analytics**: Track vector search effectiveness

## 📚 Documentation

- [Redis Setup Guide](REDIS_SETUP.md) - Detailed setup instructions
- [Backend API Docs](http://localhost:8080/docs) - Interactive API documentation

## ✅ Testing

```bash
# Test Redis connection
redis-cli ping

# Test TTS endpoint
curl -X POST http://localhost:8080/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello FINNY", "voice": "alloy"}'
```

---

**Status**: ✅ Complete and committed to main branch
**Commit**: `8895129 - feat: Add Redis vector database and Lava TTS/STT integration`
