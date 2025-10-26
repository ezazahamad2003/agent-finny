# Redis Vector Database Setup for FINNY

This guide explains how to set up Redis as the vector database for LLM context retrieval in FINNY.

## Overview

FINNY uses Redis with vector search capabilities to:
- Store financial context and insights
- Enable semantic search over transaction data and metrics
- Provide relevant context to LLM agents

## Prerequisites

1. **Redis with RediSearch Module** (Redis 7+ with vector search support)
2. **OpenAI API Key** (for generating embeddings)
3. **Python dependencies** (already in requirements.txt)

## Installation Options

### Option 1: Redis Cloud (Recommended for Production)

1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a database with Redis Stack (includes RediSearch)
3. Copy connection details

### Option 2: Docker (Local Development)

```bash
docker run -d \
  --name redis-finny \
  -p 6379:6379 \
  redis/redis-stack:latest
```

This starts Redis with RediSearch and RedisInsight on port 6379.

### Option 3: Homebrew (macOS)

```bash
brew tap redis-stack/redis-stack
brew install redis-stack
brew services start redis-stack
```

### Option 4: Linux

```bash
# Download and install Redis Stack
wget https://redis.io/redis-stack-server/releases/redis-stack-server-7.2.0-v3.jammy.amd64.deb
sudo dpkg -i redis-stack-server-7.2.0-v3.jammy.amd64.deb
sudo systemctl start redis-stack-server
```

## Environment Variables

Add these to your `.env` file:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty if no password

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Lava Configuration (for TTS/STT)
LAVA_API_KEY=aks_live_...
LAVA_SELF_CONNECTION_SECRET=cons_live_...
LAVA_SELF_PRODUCT_SECRET=ps_live_...
LAVA_FORWARD_URL=https://api.lavapayments.com/v1/forward?u=
```

## How It Works

### 1. **Vector Storage**
Financial insights, transaction summaries, and metrics are embedded and stored:

```python
from app.vector_db import vector_db

# Add context
vector_db.add_financial_context(
    workspace_id="your-workspace-id",
    context_type="metric",
    content="Monthly burn rate is $11.1k with 4.3 months runway"
)
```

### 2. **Semantic Search**
Search for relevant financial context:

```python
# Search for similar financial insights
results = vector_db.search(
    query="What is our current burn rate?",
    workspace_id="your-workspace-id",
    top_k=3
)
```

### 3. **LLM Context Retrieval**
Agents use retrieved context for better insights:

```python
# Get formatted context for LLM
context = vector_db.get_context_for_query(
    workspace_id="your-workspace-id",
    query="How can we reduce burn rate?",
    top_k=3
)
```

## Testing the Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Verify Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

### 3. Check Index Creation

The vector database automatically creates an index on first use. Verify:

```bash
redis-cli FT.INFO financial_context
```

### 4. Test TTS (Text-to-Speech)

```bash
curl -X POST http://localhost:8080/voice/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, I am FINNY your AI CFO assistant.",
    "voice": "alloy",
    "speed": 1.0
  }'
```

## Voice Integration

### Text-to-Speech (TTS)

FINNY uses Lava + OpenAI TTS for voice generation:

- **Available Voices**: alloy, echo, fable, onyx, nova, shimmer
- **Speed Range**: 0.25 to 4.0
- **Format**: MP3 audio

**API Endpoints:**
- `POST /voice/tts` - Generate speech (returns audio URL)
- `POST /voice/tts-stream` - Stream audio file directly
- `POST /voice/tts-chunks` - Generate in chunks for better playback

### Speech-to-Text (STT)

STT integration is ready for future implementation with services like:
- OpenAI Whisper
- Google Speech-to-Text
- AssemblyAI

## Architecture

```
┌─────────────────┐
│   LLM Agents    │ ← Query with workspace context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vector Search  │ ← Semantic similarity search
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Redis Vector   │ ← Stored embeddings & metadata
│     Database    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OpenAI Ada-002 │ ← Generate embeddings
│   (Embeddings)  │
└─────────────────┘

┌─────────────────┐
│  Voice Agents   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Lava API       │ ← Forward TTS/STT requests
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OpenAI TTS     │ ← Generate speech audio
└─────────────────┘
```

## Troubleshooting

### Redis Not Running
```bash
redis-cli ping
# If it fails, start Redis
```

### Index Already Exists
```bash
redis-cli FT.DROPINDEX financial_context
# Then restart the application
```

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is set correctly
- Check API quota and billing

### Lava TTS Errors
- Verify `LAVA_API_KEY` and related secrets
- Check Lava dashboard for usage

## Next Steps

1. ✅ Set up Redis with RediSearch
2. ✅ Configure environment variables
3. ✅ Install Python dependencies
4. 🚀 Start using vector search in agents
5. 🎤 Integrate voice features in frontend

## Resources

- [Redis Vector Search Docs](https://redis.io/docs/stack/search/reference/vectors/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Lava Payments API](https://lavapayments.com/docs)
