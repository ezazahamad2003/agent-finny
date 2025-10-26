# Agent Finny Backend

FastAPI backend for Agent Finny - AI-powered financial assistant.

## Setup

1. **Create virtual environment**
```bash
python -m venv venv
```

2. **Activate virtual environment**
```bash
# Windows PowerShell
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual credentials
```

Required environment variables:
- `PLAID_CLIENT_ID` - From Plaid dashboard
- `PLAID_SECRET` - Sandbox secret from Plaid
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE` - Supabase service role key

## Run

```bash
uvicorn app.main:app --reload --port 8080
```

Server will start at: http://localhost:8080

- API docs: http://localhost:8080/docs
- Health check: http://localhost:8080/health

## API Endpoints

### Plaid Demo Seeding

**POST** `/plaid/demo-item`

Seeds demo transaction data from Plaid sandbox into Supabase.

Request body:
```json
{
  "workspace_id": "your-workspace-uuid"
}
```

Example:
```bash
curl -X POST 'http://localhost:8080/plaid/demo-item' \
  -H 'content-type: application/json' \
  -d '{"workspace_id":"eff079c8-5bf9-4a45-8142-2b4d009e1eb4"}'
```

Response:
```json
{
  "inserted": 150,
  "workspace_id": "eff079c8-5bf9-4a45-8142-2b4d009e1eb4"
}
```

## Database Schema

The backend expects a `transactions` table in Supabase with the following structure:

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL,
  ts DATE NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  merchant TEXT,
  note TEXT,
  source TEXT,
  raw JSONB
);
```

