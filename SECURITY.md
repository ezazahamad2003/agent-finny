# 🔒 Security Best Practices

## ⚠️ CRITICAL: Never Commit Secrets

### Protected Files (Already in .gitignore)

```
# Backend
backend/.env
backend/.env.*

# Frontend  
frontend/.env.local
frontend/.env*.local
```

**These files contain:**
- Plaid API credentials
- Supabase service role keys
- Lava API keys and secrets
- Database connection strings

---

## 🔐 Environment Variables Setup

### Backend (`backend/.env`)

```bash
# Plaid (get from https://dashboard.plaid.com/team/keys)
PLAID_ENV=sandbox  # Use 'production' only after Plaid approval
PLAID_CLIENT_ID=<your_client_id>
PLAID_SECRET=<sandbox_secret>  # NEVER commit this!

# Supabase (get from project settings > API)
SUPABASE_URL=<your_project_url>
SUPABASE_SERVICE_ROLE=<service_role_key>  # NEVER use anon key here!

# Lava (get from https://dashboard.lavapayments.com)
LAVA_FORWARD_URL=https://api.lavapayments.com/v1/forward?u=
LAVA_API_KEY=<your_api_key>  # NEVER commit this!
LAVA_SELF_CONNECTION_SECRET=<connection_secret>
LAVA_SELF_PRODUCT_SECRET=<product_secret>

# AI Provider (routed through Lava)
AI_CHAT_URL=https://api.groq.com/openai/v1/chat/completions
```

### Frontend (`frontend/.env.local`)

```bash
# Only public URL - safe to expose
NEXT_PUBLIC_API_URL=http://localhost:8080  # Change to production URL when deploying
```

---

## ✅ Pre-Commit Security Checklist

Before committing, verify:

- [ ] No `.env` files are tracked
- [ ] No API keys in code
- [ ] No hardcoded credentials
- [ ] `.env.example` files only contain placeholders
- [ ] No real workspace IDs in code (use as parameters)
- [ ] No database URLs in code
- [ ] Supabase RLS (Row Level Security) enabled
- [ ] CORS configured properly for production

---

## 🚀 Production Security

### 1. Environment Variables

**Never** use `.env` files in production. Use your platform's secrets manager:

- **Vercel**: Environment Variables in project settings
- **Railway**: Variables tab in project dashboard
- **Cloud Run**: Secret Manager integration
- **Render**: Environment tab in service settings

### 2. Supabase Security

```sql
-- Enable Row Level Security on all tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_snapshots ENABLE ROW LEVEL SECURITY;

-- Add policies (example - customize for your auth)
CREATE POLICY "Users can only see their workspace data"
  ON transactions
  FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspaces WHERE user_id = auth.uid()
  ));
```

### 3. API Rate Limiting

Add rate limiting to backend in production:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/metrics/summary")
@limiter.limit("10/minute")
async def summary(request: Request, req: WS):
    # ... existing code
```

### 4. CORS Configuration

Update for production in `backend/app/main.py`:

```python
# Development
allow_origins=["*"]  # Current setting - OK for local dev

# Production  
allow_origins=[
    "https://your-domain.com",
    "https://www.your-domain.com"
]
```

### 5. HTTPS Only

Always use HTTPS in production:
- Frontend: Vercel/Netlify provides this automatically
- Backend: Use Railway/Cloud Run/Render (all provide HTTPS)

### 6. Plaid Production Mode

When moving to production:

1. Apply for Plaid Production access
2. Update `PLAID_ENV=production`
3. Use production secrets (not sandbox)
4. Implement webhook verification
5. Add proper error handling

---

## 🔍 Sensitive Data Audit

### What's Safe to Commit ✅

- Source code (no secrets)
- `.env.example` files (placeholders only)
- README documentation
- Public configuration files
- Frontend public assets

### NEVER Commit ❌

- `.env` files
- API keys or secrets
- Database credentials
- Private keys (*.pem, *.key)
- Access tokens
- Service role keys
- Real workspace IDs in code
- User data or PII

---

## 🛡️ Security Headers (Production)

Add to backend in production:

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Security headers
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["your-domain.com", "*.your-domain.com"]
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

---

## 📝 Incident Response

If credentials are accidentally committed:

1. **Immediately rotate all exposed credentials:**
   - Plaid: Regenerate secrets at dashboard.plaid.com
   - Supabase: Regenerate service role key
   - Lava: Rotate API keys at dashboard.lavapayments.com

2. **Remove from Git history:**
```bash
# Remove sensitive file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team!)
git push origin --force --all
```

3. **Update .gitignore** to prevent future commits

4. **Notify affected services** (Plaid, Supabase, Lava)

---

## 🔗 Security Resources

- **Plaid Security**: https://plaid.com/docs/api/security/
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/

---

## 📞 Security Contacts

For security issues, contact:
- Plaid Support: https://dashboard.plaid.com/support
- Supabase: https://supabase.com/support
- Lava: support@lavapayments.com

---

**Remember: Security is not a feature, it's a requirement.** ✨

