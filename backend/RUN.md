# How to Run the FINNY Backend

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in the `backend` directory with:

```bash
# Plaid Configuration
PLAID_ENV=sandbox
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your_service_role_key

# Lava Configuration
LAVA_FORWARD_URL=https://api.lavapayments.com/v1/forward?u=
LAVA_API_KEY=your_lava_api_key
LAVA_SELF_CONNECTION_SECRET=your_connection_secret
LAVA_SELF_PRODUCT_SECRET=your_product_secret

# AI Configuration
AI_CHAT_URL=https://api.groq.com/openai/v1/chat/completions
```

### 3. Run the Server

```bash
uvicorn app.main:app --reload --port 8080
```

The server will start at: **http://localhost:8080**

## Available Endpoints

- **Health Check**: `GET http://localhost:8080/health`
- **API Docs**: `http://localhost:8080/docs` (Interactive Swagger UI)
- **Plaid Demo**: `POST http://localhost:8080/plaid/demo-item`
- **Metrics**: `POST http://localhost:8080/metrics/summary`
- **AI Agents**: `POST http://localhost:8080/agent/insights`

## Testing

Test with curl:

```bash
curl http://localhost:8080/health
```

Or visit http://localhost:8080/docs for interactive API documentation.
