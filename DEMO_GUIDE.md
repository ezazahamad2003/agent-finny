# 🎬 Agent Finny - Demo Guide

## 🚀 Quick Start (Both Servers)

### Terminal 1 - Backend
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8080
```
**Running at:** http://localhost:8080

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```
**Running at:** http://localhost:3000

---

## 🏦 Plaid Sandbox - NO PHONE NEEDED

### ✅ Recommended Flow (Fastest)

1. **Click "Connect Sandbox Bank"** on `/connect` page
2. **Search for:** `First Platypus Bank` (or `Bank of Sandbox`)
3. **Login with:**
   - Username: `user_good`
   - Password: `pass_good`
   - MFA Code: `1234` (if prompted)
4. **Select accounts** → Continue
5. **Success!** → Transactions load → Dashboard shows

### ❌ Avoid Phone Verification Issues

Some sandbox institutions simulate SMS and **will reject phone numbers** (even valid E.164 format).

**If you see "Invalid phone number":**
- ✅ Use **First Platypus Bank** instead
- ✅ Use **Bank of Sandbox** instead
- ❌ Don't use institutions that require phone verification

### 🔄 Alternative: One-Click Demo

If Plaid Link is slow or buggy:
1. Click **"Load Demo Data (One-Click)"** button
2. Instantly seeds 17 transactions
3. Redirects to dashboard

---

## 🎤 60-Second Judge Demo Script

### 1. Intro (5s)
"Agent Finny is an AI CFO assistant that connects your bank and provides real-time insights."

### 2. Onboard (10s)
- Navigate to http://localhost:3000
- Enter: **"Acme Robotics"**
- Click: **Continue**

### 3. Connect (15s)
**Option A - Plaid Link (more impressive):**
- Click: **"Connect Sandbox Bank"**
- Search: **"First Platypus Bank"**
- Login: `user_good` / `pass_good`
- MFA: `1234`
- ✅ Connected!

**Option B - One-Click (faster, safer):**
- Click: **"Load Demo Data"**
- ✅ 17 transactions loaded instantly

### 4. Dashboard (25s)
**Point out:**
- 💰 **Cash:** $45,000
- 🔥 **Burn Rate:** $11,145/month (3-month avg)
- 📅 **Runway:** 4 months ⚠️
- 📊 **Chart:** Revenue vs Expense by month
- 🏷️ **Top Categories:** Biggest spend areas

### 5. AI Insights (10s)
- Click: **"Ask Finny"**
- ⚡ **<1 second response** via Lava → Groq
- **Show insights:**
  - Burn rate analysis
  - Runway warning
  - Recommendations

### 6. Close (5s)
"All AI calls go through Lava for transparent usage tracking and payments."

**Total: 60-70 seconds**

---

## 🔍 Troubleshooting

### Frontend shows `POST /undefined/plaid/...`
**Fix:** `.env.local` missing or not loaded
```powershell
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
# Restart: Ctrl+C then npm run dev
```

### Backend 500 errors
**Fix:** Check `.env` has all credentials:
```bash
PLAID_CLIENT_ID=...
PLAID_SECRET=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...
LAVA_API_KEY=...
LAVA_SELF_CONNECTION_SECRET=...
LAVA_SELF_PRODUCT_SECRET=...
```

### Plaid Link "Invalid phone number"
**Fix:** Don't use phone verification institutions
- ✅ Use: **First Platypus Bank**
- ✅ Use: **Bank of Sandbox**
- ❌ Avoid: Institutions asking for phone

### No transactions showing
**Fix:** Load demo data
```powershell
curl -X POST http://localhost:8080/plaid/demo-item -H 'content-type: application/json' -d '{"workspace_id":"eff079c8-5bf9-4a45-8142-2b4d009e1eb4"}'
```

### AI insights not working
**Fix:** Check Lava credentials in `backend/.env`
- Verify at: https://dashboard.lavapayments.com

---

## 📋 Pre-Demo Checklist

- [ ] Backend running (http://localhost:8080/health returns `{"ok": true}`)
- [ ] Frontend running (http://localhost:3000 loads)
- [ ] `.env.local` exists in `frontend/` folder
- [ ] Test the full flow once before judging
- [ ] Have backup: "Load Demo Data" button ready if Plaid is slow
- [ ] Lava dashboard open to show usage tracking

---

## 🎯 Key Talking Points

1. **Real Bank Connection** - Plaid integration (show sandbox)
2. **Financial Metrics** - Burn rate, runway, cash flow
3. **AI-Powered** - Lava routes to Groq for fast inference (<1s)
4. **Transparent Costs** - All AI usage tracked in Lava dashboard
5. **Production Ready** - Can connect real banks with Plaid production

---

## 🔗 Useful Links

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- API Docs: http://localhost:8080/docs
- Lava Dashboard: https://dashboard.lavapayments.com

**Workspace ID for testing:**
```
eff079c8-5bf9-4a45-8142-2b4d009e1eb4
```

