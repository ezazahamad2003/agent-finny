# ✅ Pre-Commit Checklist

Complete this before making your first commit.

## 🔒 Security Verification

- [ ] **NO** `.env` files in staging area
  ```bash
  git status | grep -E "\.env"  # Should return nothing
  ```

- [ ] **NO** API keys in code
  ```bash
  grep -r "PLAID_CLIENT_ID\|PLAID_SECRET\|LAVA_API_KEY" --include="*.py" --include="*.ts" --include="*.tsx" backend/ frontend/
  # Should only find .env.example files
  ```

- [ ] `.gitignore` properly configured
  ```bash
  cat .gitignore | grep ".env"  # Should show .env patterns
  ```

- [ ] All secrets in `.env.example` are placeholders
  ```bash
  cat backend/.env.example | grep "<"  # Should show <placeholders>
  ```

---

## 📁 File Structure

- [ ] Backend structure:
  ```
  backend/
  ├── app/
  │   ├── __init__.py
  │   ├── main.py
  │   ├── plaid.py
  │   ├── metrics.py
  │   └── agent.py
  ├── requirements.txt
  ├── .env.example ✅
  ├── .gitignore ✅
  └── README.md
  ```

- [ ] Frontend structure:
  ```
  frontend/
  ├── app/
  │   ├── page.tsx (onboard)
  │   ├── connect/page.tsx
  │   └── dashboard/page.tsx
  ├── package.json
  ├── .env.local (NOT COMMITTED) ❌
  ├── .gitignore ✅
  └── README.md
  ```

---

## 🧪 Testing

Run these commands before committing:

### Backend Tests
```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows

# Health check
curl http://localhost:8080/health

# Test workspace (use your actual workspace_id)
curl -X POST http://localhost:8080/plaid/demo-item \
  -H 'content-type: application/json' \
  -d '{"workspace_id":"eff079c8-5bf9-4a45-8142-2b4d009e1eb4"}'
```

- [ ] Backend starts without errors
- [ ] Health endpoint returns `{"ok": true}`
- [ ] Demo seeding works

### Frontend Tests
```bash
cd frontend

# Check .env.local exists
ls .env.local  # Should exist

# Start dev server
npm run dev
```

- [ ] Frontend starts without errors
- [ ] Can access http://localhost:3000
- [ ] Onboard page loads
- [ ] Connect page loads
- [ ] Dashboard page loads (after data seeding)

---

## 📝 Documentation

- [ ] Root `README.md` has:
  - [ ] Project description
  - [ ] Setup instructions
  - [ ] Tech stack
  - [ ] API endpoints
  - [ ] Environment variables guide

- [ ] `SECURITY.md` created with best practices

- [ ] `DEMO_GUIDE.md` created with judge demo script

- [ ] Both `backend/README.md` and `frontend/README.md` exist

---

## 🧹 Code Quality

- [ ] No console.logs in production code (except intentional logging)
- [ ] No commented-out code blocks
- [ ] No TODO comments (or documented in issues)
- [ ] Consistent code formatting
- [ ] TypeScript errors resolved (frontend)
- [ ] No Python import errors (backend)

---

## 🎯 Functionality

- [ ] **Onboarding** works (/)
- [ ] **Bank Connection** works (/connect)
  - [ ] Plaid Link modal opens
  - [ ] OR One-click demo button works
- [ ] **Dashboard** displays (/dashboard)
  - [ ] KPI cards show data
  - [ ] Chart renders
  - [ ] AI insights button works

---

## 📦 Dependencies

- [ ] `backend/requirements.txt` is up to date
  ```bash
  cd backend
  pip freeze | grep -E "fastapi|uvicorn|httpx|supabase|python-dotenv"
  ```

- [ ] `frontend/package.json` has all dependencies
  ```bash
  cd frontend
  npm list react react-dom next chart.js react-chartjs-2 axios react-plaid-link
  ```

---

## 🚀 Git Preparation

### 1. Initialize Git (if not already)
```bash
git init
```

### 2. Check what will be committed
```bash
git add -A
git status
```

**RED FLAGS** - Should NOT appear:
- ❌ `backend/.env`
- ❌ `frontend/.env.local`
- ❌ `node_modules/`
- ❌ `__pycache__/`
- ❌ `venv/`
- ❌ `.next/`

**GREEN FLAGS** - Should appear:
- ✅ `backend/app/*.py`
- ✅ `frontend/app/**/*.tsx`
- ✅ `.gitignore`
- ✅ `README.md`
- ✅ `*.example` files

### 3. Review diff
```bash
git diff --cached
```

### 4. Final security check
```bash
# Search for potential secrets
git diff --cached | grep -iE "api_key|secret|password|token" | grep -v "example"
# Should only show variable names, not actual values
```

---

## 💾 Commit

### If everything passes:

```bash
git add .
git commit -m "feat: Initial Agent Finny implementation

- Backend: FastAPI with Plaid, Supabase, Lava integration
- Frontend: Next.js dashboard with financial metrics
- Features: Bank connection, metrics calculation, AI insights
- Security: All credentials in .env (not committed)"
```

### Create GitHub repo:

```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/yourusername/agent-finny.git
git branch -M main
git push -u origin main
```

---

## 🔍 Post-Commit Verification

After pushing to GitHub:

- [ ] Visit GitHub repo and verify:
  - [ ] No `.env` files visible
  - [ ] Only `.env.example` files present
  - [ ] README.md renders correctly
  - [ ] All source files present

- [ ] Clone repo to fresh directory and test:
  ```bash
  git clone https://github.com/yourusername/agent-finny.git test-clone
  cd test-clone
  # Setup and run - should work after adding .env files
  ```

---

## 🎉 Done!

Your repo is now:
- ✅ Secure (no secrets committed)
- ✅ Well-documented
- ✅ Demo-ready
- ✅ Professional

**Next steps:**
1. Share repo with judges
2. Deploy to production
3. Demo with confidence! 🚀

---

**Questions?** Review `SECURITY.md` for detailed security guidelines.

