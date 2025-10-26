# Agent Finny - Frontend

Next.js frontend for Agent Finny AI-powered CFO assistant.

## Demo Flow

1. **Onboard** (`/`) - Enter startup name and optional website
2. **Connect** (`/connect`) - Link bank via Plaid or load demo data
3. **Dashboard** (`/dashboard`) - View metrics, charts, and AI insights

## Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

3. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2
- **Bank Connection**: Plaid Link (react-plaid-link)
- **HTTP Client**: Axios

## API Endpoints Used

- `POST /plaid/link-token` - Get Plaid Link token
- `POST /plaid/exchange` - Exchange public token for transactions
- `POST /plaid/demo-item` - Load demo data (one-click)
- `POST /metrics/summary` - Get revenue/expense metrics
- `POST /metrics/burn_runway` - Get burn rate and runway
- `POST /agent/insights` - Get AI CFO insights (Lava-powered)

## Demo Credentials

**Plaid Sandbox:**
- Username: `user_good`
- Password: `pass_good`
- MFA Code: `1234`

## Judge Demo Script (60-90s)

1. **Onboard**: Enter "Acme Robotics"
2. **Connect**: Click "Connect Sandbox Bank" → use test creds OR click "Load Demo Data"
3. **Dashboard**: View cash, burn rate, runway, and charts
4. **AI Insights**: Click "Ask Finny" → see AI-powered CFO analysis
5. **Highlight**: Lava-powered AI with <1s latency

## Production Deployment

**Vercel (Recommended):**
```bash
npm run build
vercel --prod
```

Set environment variable:
- `NEXT_PUBLIC_API_URL` = your backend URL

## Features

✅ Clean, modern UI with Tailwind CSS
✅ Plaid Link integration for bank connections
✅ One-click demo data loading
✅ Real-time financial metrics
✅ Interactive charts
✅ AI-powered CFO insights via Lava
✅ Responsive design
✅ TypeScript for type safety
