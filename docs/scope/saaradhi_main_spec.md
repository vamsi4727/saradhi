# Saaradhi — Main Application Specification
> AI-Powered Financial Co-Pilot for the Indian Market  
> Domain: `saradhi.katakam.in` | Stack: React + Vite + Node.js + Python + Claude API  
> Companion doc: `saaradhi_admin_spec.md` (Admin Portal)

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture & Stack Decisions](#2-architecture--stack-decisions)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema — NeonDB](#5-database-schema--neondb)
6. [Design System](#6-design-system)
7. [Feature Modules](#7-feature-modules)
8. [API Contracts](#8-api-contracts)
9. [AI Prompt Engineering](#9-ai-prompt-engineering)
10. [Data Pipeline](#10-data-pipeline)
11. [Freemium & Auth Logic](#11-freemium--auth-logic)
12. [SEBI Disclaimer Architecture](#12-sebi-disclaimer-architecture)
13. [Build, Deploy & Hosting](#13-build-deploy--hosting)
14. [Phase-wise Roadmap](#14-phase-wise-roadmap)

---

## 1. Project Overview

**Saaradhi** is an AI-powered financial co-pilot for Indian retail investors.  
It is **not** a trading terminal. It is an intelligence layer that:

- Profiles users via conversational onboarding (no boring forms)
- Delivers personalized, AI-explained investment recommendations
- Allows natural language Q&A about stocks, MFs, ETFs, and FDs
- Hands off trade execution to partner brokers via API

**Target users:** Confused beginners + time-poor intermediate investors  
**Asset classes:** NSE/BSE Stocks, Mutual Funds, ETFs, Fixed Deposits  
**Legal posture:** Educational/research platform with prominent disclaimers (not SEBI RIA — to be obtained post-traction)  
**Monetization:** Freemium from day one  
**Domain:** `saradhi.katakam.in`  
**Admin portal:** `saradhi-admin.katakam.in` — see `saaradhi_admin_spec.md`

---

## 2. Architecture & Stack Decisions

### Final Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Fast HMR, lightweight, Cursor-friendly |
| Backend | Node.js (Express) | Same language as frontend, excellent Claude SDK |
| AI/Data scripts | Python (FastAPI) | yfinance, pandas, NLP libraries are Python-native |
| AI API | Claude API (`claude-sonnet-4-6`) | Best financial reasoning, already in your ecosystem |
| Auth | Google OAuth via Passport.js | Indian users prefer Google login, 30 min to implement |
| Database | **NeonDB** (PostgreSQL) | You already have it — no reason to switch |
| DB Client | `pg` (node-postgres) | Standard, battle-tested Postgres client for Node |
| Market Data | yfinance (Python) | Free, covers NSE/BSE EOD data + fundamentals |
| MF Data | MFAPI.in | Free API for Indian mutual fund NAV data |
| News/Sentiment | NewsAPI (~₹4,000/month) | Financial headlines for sentiment scoring |
| FD Rates | Hardcoded + monthly updates | RBI published rates, no live API needed |
| Payments | Razorpay | Indian-first, UPI + cards |
| Frontend deploy | Vercel (Project 1) | Your existing account, second project — no issue |
| Admin deploy | Vercel (Project 2) | Same account, separate project |
| Backend deploy | Railway | Node + Python services, ~₹850/month combined |

### Key Decisions Explained

**NeonDB not Supabase:** You already run Postgres on NeonDB. Every schema in this doc is standard SQL — runs identically on Neon. We use `pg` (node-postgres) directly in Node.js. No migration needed.

**Two Vercel projects:** Vercel free tier supports unlimited projects. `frontend/` → Project 1 at `saradhi.katakam.in`. `admin-portal/` → Project 2 at `saradhi-admin.katakam.in`. Both point to the same monorepo, different root directories.

**One backend for both:** Admin API routes (`/admin/api/*`) live in the same Node.js Express app as the user-facing routes. Separated by middleware, not by service.

**Prompts in DB:** Every Claude prompt is stored in NeonDB, not hardcoded. Admin portal edits them live. See `saaradhi_admin_spec.md` Section 3 for the Prompt Studio.

### Data Flow
```
User input (goal / question)
        ↓
Node.js Express API
  → auth check (Passport.js session)
  → freemium rate limit check
  → fetch active prompt from NeonDB (5-min cache)
        ↓
Python FastAPI microservice
  → yfinance: stock fundamentals + sparkline
  → MFAPI.in: mutual fund NAV
  → NewsAPI + TextBlob: sentiment score
        ↓
Claude API (claude-sonnet-4-6)
  → system prompt (from DB) + user profile + market data
  → streamed response
        ↓
Node.js
  → log full query to NeonDB (query_logs table) — fire and forget
  → update conversation session totals
  → stream response to frontend
        ↓
React frontend
  → render chat bubble / recommendation card
```

---

## 3. Monorepo Structure

```
saradhi/
│
├── frontend/                        ← Vercel Project 1 → saradhi.katakam.in
│   ├── public/
│   │   ├── favicon.ico
│   │   └── logo.svg
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   │
│   │   ├── pages/
│   │   │   ├── Landing.jsx          ← Public landing page
│   │   │   ├── Onboarding.jsx       ← Conversational risk profiling
│   │   │   ├── Dashboard.jsx        ← "For You" recommendation feed
│   │   │   ├── CoPilot.jsx          ← AI chat
│   │   │   ├── StockDetail.jsx      ← Individual asset page
│   │   │   ├── Portfolio.jsx        ← Portfolio tracker
│   │   │   ├── Goals.jsx            ← Investment goals
│   │   │   ├── Profile.jsx          ← User risk profile
│   │   │   ├── Subscription.jsx     ← Freemium upgrade
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── BottomNav.jsx    ← Mobile-first fixed nav
│   │   │   ├── onboarding/
│   │   │   │   ├── ChatBubble.jsx
│   │   │   │   ├── ChatInput.jsx
│   │   │   │   └── ProfileSummaryCard.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── RecommendationCard.jsx
│   │   │   │   ├── Sparkline.jsx
│   │   │   │   └── SentimentBadge.jsx
│   │   │   ├── copilot/
│   │   │   │   ├── CoPilotChat.jsx
│   │   │   │   └── QuickPrompts.jsx
│   │   │   ├── execution/
│   │   │   │   └── BrokerSheet.jsx
│   │   │   └── common/
│   │   │       ├── DisclaimerBanner.jsx
│   │   │       ├── PremiumGate.jsx
│   │   │       ├── LoadingDots.jsx
│   │   │       └── Toast.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useRecommendations.js
│   │   │   ├── useCoPilot.js
│   │   │   └── useFreemium.js
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.js         ← Zustand
│   │   │   ├── profileStore.js
│   │   │   └── recommendationStore.js
│   │   │
│   │   └── services/
│   │       ├── api.js               ← Axios instance with auth interceptors
│   │       ├── authService.js
│   │       ├── recommendationService.js
│   │       └── copilotService.js
│   │
│   ├── .env.local
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── admin-portal/                    ← Vercel Project 2 → saradhi-admin.katakam.in
│   │                                   See saaradhi_admin_spec.md for full detail
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx        ← Overview stats
│   │   │   ├── PromptStudio.jsx     ← Edit Claude prompts live
│   │   │   ├── QueryLogs.jsx        ← All user queries
│   │   │   ├── ConversationDetail.jsx
│   │   │   ├── TokenAnalytics.jsx
│   │   │   └── UserManagement.jsx
│   │   └── ...
│   └── package.json
│
├── backend/                         ← Railway → api.saradhi.katakam.in
│   ├── src/
│   │   ├── index.js                 ← Express app entry
│   │   ├── config/
│   │   │   ├── db.js                ← NeonDB pg pool
│   │   │   ├── passport.js          ← Google OAuth
│   │   │   └── claude.js            ← Anthropic client
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── recommendations.routes.js
│   │   │   ├── copilot.routes.js
│   │   │   ├── market.routes.js
│   │   │   ├── subscription.routes.js
│   │   │   └── admin.routes.js      ← Admin APIs, see saaradhi_admin_spec.md
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── recommendations.controller.js
│   │   │   ├── copilot.controller.js
│   │   │   ├── market.controller.js
│   │   │   ├── admin.logs.controller.js
│   │   │   ├── admin.prompts.controller.js
│   │   │   ├── admin.analytics.controller.js
│   │   │   └── admin.users.controller.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── adminAuth.middleware.js   ← Simple password check for admin
│   │   │   └── freemium.middleware.js
│   │   │
│   │   └── services/
│   │       ├── claudeService.js     ← All Claude calls + logging baked in
│   │       ├── promptService.js     ← Fetches active prompts from NeonDB
│   │       ├── pythonBridge.js      ← HTTP calls to Python service
│   │       ├── cacheService.js      ← In-memory cache (node-cache)
│   │       └── razorpayService.js
│   │
│   └── package.json
│
├── python-service/                  ← Railway → python.saradhi.katakam.in (internal)
│   ├── main.py
│   ├── routers/
│   │   ├── stocks.py
│   │   ├── mutual_funds.py
│   │   ├── etfs.py
│   │   ├── fixed_deposits.py
│   │   └── sentiment.py
│   ├── services/
│   │   ├── yfinance_service.py
│   │   ├── mfapi_service.py
│   │   ├── news_service.py
│   │   └── fundamental_scorer.py
│   ├── requirements.txt
│   └── .env
│
└── shared/                          ← Shared constants (JS)
    ├── riskProfiles.js
    ├── assetClasses.js
    ├── claudePricing.js             ← Token cost calculator
    └── disclaimerText.js
```

---

## 4. Environment Variables

### frontend/.env.local
```env
VITE_API_BASE_URL=https://api.saradhi.katakam.in
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_RAZORPAY_KEY_ID=your_razorpay_key
VITE_APP_ENV=production
```

### backend/.env
```env
PORT=5000
NODE_ENV=production

# NeonDB — your existing Postgres
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/saradhi?sslmode=require

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=a_long_random_string_for_user_sessions
CALLBACK_URL=https://api.saradhi.katakam.in/api/auth/google/callback

# Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key
CLAUDE_MODEL=claude-sonnet-4-6

# Python service (internal Railway URL)
PYTHON_SERVICE_URL=https://python-service.railway.internal

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend (CORS + OAuth redirect)
FRONTEND_URL=https://saradhi.katakam.in

# Admin — simple password auth (see admin spec)
ADMIN_PASSWORD=choose_a_strong_password
ADMIN_SESSION_SECRET=another_long_random_string
ADMIN_PORTAL_URL=https://saradhi-admin.katakam.in
```

### admin-portal/.env.local
```env
VITE_ADMIN_API_URL=https://api.saradhi.katakam.in/admin/api
```

### python-service/.env
```env
NEWS_API_KEY=your_newsapi_key
PORT=8000
CACHE_TTL_SECONDS=3600
```

---

## 5. Database Schema — NeonDB

> Run all of the following in your NeonDB SQL editor.  
> NeonDB is standard PostgreSQL — all syntax is identical.

```sql
-- ================================================================
-- USER-FACING TABLES
-- ================================================================

-- Users (populated on first Google login)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id     TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  is_suspended  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Risk profiles (one per user, updated on re-onboarding)
CREATE TABLE risk_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  goal                 TEXT NOT NULL,
  goal_amount          NUMERIC,
  time_horizon_years   INTEGER,
  risk_tolerance       TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  monthly_investment   NUMERIC,
  existing_investments TEXT,
  raw_onboarding_text  TEXT,
  completed            BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- AI recommendations (cached per user, refreshed by schedule)
CREATE TABLE recommendations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  asset_type        TEXT CHECK (asset_type IN ('stock', 'mutual_fund', 'etf', 'fd')),
  symbol            TEXT,
  name              TEXT,
  rationale         TEXT,
  sentiment_score   NUMERIC,
  fundamental_score NUMERIC,
  composite_score   NUMERIC,
  price             NUMERIC,
  change_pct        NUMERIC,
  sparkline_data    JSONB,
  is_active         BOOLEAN DEFAULT TRUE,
  generated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Freemium usage tracking (per user per day)
CREATE TABLE usage_tracking (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  feature   TEXT,
  used_at   TIMESTAMPTZ DEFAULT NOW(),
  date      DATE DEFAULT CURRENT_DATE
);

-- Subscriptions
CREATE TABLE subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT,
  plan                     TEXT DEFAULT 'pro',
  status                   TEXT DEFAULT 'active',
  started_at               TIMESTAMPTZ DEFAULT NOW(),
  expires_at               TIMESTAMPTZ
);

-- ================================================================
-- ADMIN & LOGGING TABLES
-- (queried by admin portal — see saaradhi_admin_spec.md)
-- ================================================================

-- Conversation sessions (groups multiple turns together)
CREATE TABLE conversation_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id),
  feature             TEXT,
  total_turns         INTEGER DEFAULT 0,
  total_input_tokens  INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_cost_inr      NUMERIC DEFAULT 0,
  total_latency_ms    INTEGER DEFAULT 0,
  is_completed        BOOLEAN DEFAULT FALSE,
  completion_turn     INTEGER,
  started_at          TIMESTAMPTZ DEFAULT NOW(),
  last_activity       TIMESTAMPTZ DEFAULT NOW(),
  ended_at            TIMESTAMPTZ
);

-- Full query logs (every Claude API call, logged automatically)
CREATE TABLE query_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  session_id        UUID REFERENCES conversation_sessions(id),
  feature           TEXT NOT NULL,
  turn_number       INTEGER DEFAULT 1,
  user_message      TEXT,
  system_prompt_key TEXT,
  prompt_version    INTEGER,
  injected_context  JSONB,
  claude_response   TEXT,
  input_tokens      INTEGER,
  output_tokens     INTEGER,
  total_tokens      INTEGER,
  model             TEXT DEFAULT 'claude-sonnet-4-6',
  input_cost_usd    NUMERIC(10,6),
  output_cost_usd   NUMERIC(10,6),
  total_cost_usd    NUMERIC(10,6),
  cost_inr          NUMERIC(10,4),
  latency_ms        INTEGER,
  flags             TEXT[],
  error             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Claude prompts (edited live from admin portal)
CREATE TABLE prompt_templates (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key           TEXT NOT NULL,
  version              INTEGER NOT NULL,
  system_prompt        TEXT NOT NULL,
  user_prompt_template TEXT,
  variables            JSONB,
  is_active            BOOLEAN DEFAULT FALSE,
  is_draft             BOOLEAN DEFAULT TRUE,
  change_notes         TEXT,
  published_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active prompt per key at a time
CREATE UNIQUE INDEX one_active_prompt_per_key
  ON prompt_templates(prompt_key)
  WHERE is_active = TRUE;

-- Admin action audit trail
CREATE TABLE admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX idx_recommendations_user_id   ON recommendations(user_id);
CREATE INDEX idx_usage_tracking_user_date  ON usage_tracking(user_id, date);
CREATE INDEX idx_query_logs_user_id        ON query_logs(user_id);
CREATE INDEX idx_query_logs_session_id     ON query_logs(session_id);
CREATE INDEX idx_query_logs_feature        ON query_logs(feature);
CREATE INDEX idx_query_logs_created_at     ON query_logs(created_at DESC);
CREATE INDEX idx_query_logs_flags          ON query_logs USING GIN(flags);

-- ================================================================
-- HELPER FUNCTION — increments session totals after each Claude call
-- ================================================================
CREATE OR REPLACE FUNCTION increment_session_totals(
  p_session_id    UUID,
  p_input_tokens  INTEGER,
  p_output_tokens INTEGER,
  p_cost_inr      NUMERIC,
  p_latency_ms    INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE conversation_sessions SET
    total_turns         = total_turns + 1,
    total_input_tokens  = total_input_tokens + p_input_tokens,
    total_output_tokens = total_output_tokens + p_output_tokens,
    total_cost_inr      = total_cost_inr + p_cost_inr,
    total_latency_ms    = total_latency_ms + p_latency_ms,
    last_activity       = NOW()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Design System

### Typography — IBM Plex (Trustworthy & Institutional)

IBM Plex was designed to convey precision, reliability, and intelligence. It is used by financial institutions globally. It has excellent Devanagari support for future Hindi i18n, and a dedicated monospace variant for prices/numbers.

```html
<!-- Add to index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Serif:wght@400;600&display=swap" rel="stylesheet">
```

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        // UI text — headings, labels, body
        sans:  ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        // Prices, tokens, numbers — ALWAYS use this for financial figures
        mono:  ['"IBM Plex Mono"', 'monospace'],
        // Section titles, landing page hero text — gravitas
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
      },
    }
  }
}
```

**Typography usage rules:**
- `font-sans` — all UI text, buttons, labels, chat bubbles, rationale text
- `font-mono` — ALL numbers: prices (₹1,623.45), percentages (+1.2%), token counts, P/E ratios
- `font-serif` — landing page hero headline only ("Your Financial Co-Pilot")
- Never mix fonts within the same number — ₹ symbol uses `font-mono` too

```jsx
// Example — price always in IBM Plex Mono
<span className="font-mono text-lg font-semibold text-gray-900">
  ₹1,623.45
</span>
<span className="font-mono text-sm font-medium text-green-600">
  +1.24%
</span>
```

### Color Palette

```javascript
// tailwind.config.js — extend colors
colors: {
  // Primary brand — deep indigo (institutional, not flashy)
  brand: {
    50:  '#EEF2FF',
    100: '#E0E7FF',
    500: '#4F46E5',   // primary buttons, active states
    700: '#3730A3',   // headers, nav
    900: '#1E1B4B',   // darkest — hero text
  },

  // Action CTA — saffron (Indian, warm, trustworthy)
  saffron: {
    400: '#FBBF24',
    500: '#F59E0B',   // primary CTA button
    600: '#D97706',   // hover state
  },

  // Sentiment
  bull:    '#16A34A',   // green-600 — positive price, good sentiment
  bear:    '#DC2626',   // red-600  — negative price, bad sentiment
  neutral: '#6B7280',   // gray-500 — neutral sentiment

  // Surfaces
  surface: '#F8FAFC',   // page background — slightly blue-white (institutional)
  card:    '#FFFFFF',
  border:  '#E2E8F0',
}
```

### Spacing & Layout
- **Mobile-first:** Design for 390px width, scale up
- Max content width: `max-w-md mx-auto` (390px)
- Card padding: `p-5`
- Card radius: `rounded-2xl`
- Card shadow: `shadow-sm border border-slate-100`
- Bottom nav height: `h-16` (fixed)
- CTA button: `w-full py-3.5 rounded-xl font-semibold`

### Component Tone Rules
- **No gradients** on data — gradients feel untrustworthy with numbers
- **No animations on prices** — prices should feel stable, not bouncy
- **Subtle transitions only** — `transition-colors duration-150` on buttons
- **High contrast text** — minimum 4.5:1 contrast ratio (WCAG AA)
- **Dense but breathable** — financial apps need information density, not empty space

---

## 7. Feature Modules

### 7.1 Conversational Onboarding

**What it does:** Extracts risk profile from natural conversation — no forms.

**Flow:**
1. User lands on `/onboarding` after Google login
2. Saaradhi opens: *"Namaste! I'm Saaradhi, your financial co-pilot. What are we investing for today?"*
3. User types freely — e.g. *"I want ₹50 lakhs for my daughter's college in 8 years"*
4. Claude extracts: goal, amount, time horizon, risk tolerance
5. 1-2 follow-up questions if needed (monthly budget, existing investments)
6. After 3-5 turns, Claude generates a profile summary card
7. User checks disclaimer consent box → confirms → saved to NeonDB → redirect to Dashboard

**Free/Pro:** Always free. Never gate onboarding.

**Components:** `Onboarding.jsx`, `ChatBubble.jsx`, `ChatInput.jsx`, `ProfileSummaryCard.jsx`

---

### 7.2 "For You" Dashboard

**What it does:** 3–5 personalized recommendation cards with AI rationale.

**Scoring formula:**
```
composite_score = (fundamental_score × 0.5)
                + (sentiment_score × 0.3)
                + (profile_match_score × 0.2)
```

**Profile match logic:**
- `conservative` → boost FDs, large-cap stocks, debt MFs; penalize small-cap
- `moderate` → balanced across blue-chip stocks, hybrid MFs, ETFs
- `aggressive` → boost small-cap, sectoral ETFs, high-growth stocks

**Caching:** Recommendations generated once, stored in NeonDB.  
Free: refreshed every 24h | Pro: refreshed every 6h

**Card data shape:**
```json
{
  "id": "uuid",
  "name": "HDFC Bank Ltd",
  "symbol": "HDFCBANK.NS",
  "asset_type": "stock",
  "price": 1623.45,
  "change_pct": 1.24,
  "rationale": "Recommended for your 8-year education goal — strong balance sheet, low D/E ratio of 0.9, positive earnings momentum. | AI insight, not financial advice.",
  "sentiment_score": 0.72,
  "composite_score": 0.81,
  "sparkline_data": [1580, 1590, 1602, 1610, 1623]
}
```

**RecommendationCard component:**
```jsx
<div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-3">
  <div className="flex justify-between items-start mb-3">
    <div>
      <span className="text-xs font-medium text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
        {asset_type.replace('_', ' ')}
      </span>
      <h3 className="font-sans font-semibold text-gray-900 mt-1.5 text-base">{name}</h3>
      <p className="font-mono text-xs text-gray-400 mt-0.5">{symbol}</p>
    </div>
    <div className="text-right">
      <p className="font-mono font-semibold text-gray-900 text-base">
        ₹{price.toLocaleString('en-IN')}
      </p>
      <p className={`font-mono text-sm font-medium mt-0.5 ${change_pct >= 0 ? 'text-bull' : 'text-bear'}`}>
        {change_pct >= 0 ? '▲' : '▼'} {Math.abs(change_pct).toFixed(2)}%
      </p>
    </div>
  </div>

  <Sparkline data={sparkline_data} positive={change_pct >= 0} />

  <p className="font-sans text-sm text-gray-600 mt-3 leading-relaxed">
    🤖 {rationale}
  </p>

  <button className="w-full mt-4 bg-saffron-500 hover:bg-saffron-600 text-white font-sans font-semibold py-3.5 rounded-xl transition-colors duration-150">
    Invest Now →
  </button>
</div>
```

---

### 7.3 AI Co-Pilot Chat

**What it does:** Natural language Q&A about any stock, MF, market condition.

**Streaming:** Uses Claude's streaming API + SSE (Server-Sent Events) so responses type out in real time — critical for perceived quality.

**Quick prompts shown to new users:**
- "Summarize Tata Motors' latest earnings"
- "Compare HDFC Bank vs ICICI Bank for 5 years"
- "Best SIP options for ₹5,000/month?"
- "Is Nifty 50 overvalued right now?"
- "Explain P/E ratio in simple terms"

**Free tier:** 5 queries/day  
**Pro tier:** Unlimited

---

### 7.4 Broker Execution Hand-off

Saaradhi **never holds money**. On "Invest Now":

1. `BrokerSheet.jsx` slides up (bottom sheet, backdrop darkens)
2. User selects broker from 2×2 grid
3. Redirect to broker OAuth → user authenticates on broker's platform
4. Pre-filled order details passed via broker API

**Brokers (MVP — implement Zerodha first):**
```javascript
const BROKERS = [
  { name: 'Zerodha',   color: '#387ED1', api: 'kite_connect' },
  { name: 'Groww',     color: '#00D09C', api: 'partner_api'  },
  { name: 'Upstox',    color: '#6C2AEB', api: 'upstox_v2'   },
  { name: 'Angel One', color: '#E8421C', api: 'smart_api'   },
];
```

**Note:** Broker API agreements require business registration. For early MVP, fall back to deep-linking to broker website with pre-filled stock search.

---

### 7.5 Freemium Gate

| Feature | Free | Pro (₹299/month) |
|---|---|---|
| Onboarding | ✅ Unlimited | ✅ Unlimited |
| Recommendations | 3/day, 24h refresh | 5/day, 6h refresh |
| Co-Pilot queries | 5/day | Unlimited |
| Portfolio tracking | Basic (manual) | Full + AI insights |
| Risk alerts | ❌ | ✅ |
| Ad-free | ❌ | ✅ |

---

## 8. API Contracts

### NeonDB Connection (Node.js)

```javascript
// backend/src/config/db.js
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },  // required for NeonDB
  max: 10,
  idleTimeoutMillis: 30000,
});

// Helper for single queries
export const query = (text, params) => pool.query(text, params);
```

### User-facing Routes (Node.js Express)

```
# Auth
GET  /api/auth/google              → Redirect to Google OAuth
GET  /api/auth/google/callback     → OAuth callback, create session
GET  /api/auth/me                  → Current user + plan
POST /api/auth/logout              → Clear session

# User
GET  /api/user/profile             → Get user + risk profile
POST /api/user/profile             → Save profile post-onboarding
PUT  /api/user/profile             → Update risk profile

# Onboarding
POST /api/onboarding/chat
  Body:     { message: string, session_id: string, history: Message[] }
  Response: { reply: string, extracted_profile: object|null, is_complete: boolean }

# Recommendations
GET  /api/recommendations          → Today's recommendations for this user
POST /api/recommendations/refresh  → Force refresh (Pro only)
GET  /api/recommendations/:id      → Single recommendation detail

# Co-Pilot
POST /api/copilot/query            → Non-streaming query
POST /api/copilot/stream           → Streaming query via SSE
  Body:     { message: string, session_id: string }
GET  /api/copilot/history          → Chat history for session
GET  /api/copilot/usage            → Today's query count vs limit

# Market data (proxied from Python service)
GET  /api/market/stock/:symbol     → Price, fundamentals, sparkline, news
GET  /api/market/mf/:scheme_code   → NAV, returns, category
GET  /api/market/etf/:symbol       → ETF data
GET  /api/market/fd                → Current FD rates by bank/tenure
GET  /api/market/search?q=         → Search stocks/MFs by name

# Subscription
POST /api/subscription/create-order   → Create Razorpay order
POST /api/subscription/verify         → Verify payment → upgrade plan
GET  /api/subscription/status         → Current plan details
POST /api/subscription/cancel         → Cancel subscription
```

### Admin Routes (same Node.js app, `/admin/api/*` prefix)
> Full detail in `saaradhi_admin_spec.md` Section 10.

```
POST /admin/api/auth/login         → Password login (simple, no OAuth)
POST /admin/api/auth/logout

GET  /admin/api/prompts            → All prompt keys + versions
GET  /admin/api/prompts/:key/active
POST /admin/api/prompts/:key       → Save draft
POST /admin/api/prompts/:key/publish
POST /admin/api/prompts/:key/rollback/:version
POST /admin/api/prompts/test       → Test prompt against Claude live

GET  /admin/api/logs               → Paginated query logs
GET  /admin/api/logs/:id           → Single log detail
GET  /admin/api/logs/session/:id   → Full conversation thread

GET  /admin/api/analytics/tokens           → Cost breakdown
GET  /admin/api/analytics/conversations    → Depth + funnel stats

GET  /admin/api/users              → User list
POST /admin/api/users/:id/upgrade
POST /admin/api/users/:id/reset-limit
POST /admin/api/users/:id/suspend
```

### Python Service Routes (internal only)
```
GET  /stocks/{symbol}              → Price, P/E, D/E, EPS, 30d sparkline
GET  /stocks/top-candidates/{risk} → Top 20 stocks for given risk profile
GET  /mf/{scheme_code}             → NAV, 1M returns, category
GET  /mf/top-candidates/{risk}     → Top MFs for risk profile
GET  /sentiment/{query}            → News headlines + sentiment score
GET  /fd/rates                     → Current FD rates by bank/tenure
GET  /search?q={query}             → Multi-asset search
```

---

## 9. AI Prompt Engineering

> All prompts below are the **initial seed versions**.  
> Once live, edit and version them from the Admin Prompt Studio.  
> Seed these into the `prompt_templates` table with `is_active = TRUE, version = 1`.

### 9.1 Onboarding System Prompt
**Key:** `onboarding_system`

```
You are Saaradhi, a warm and knowledgeable Indian financial co-pilot. Your role is to understand a user's investment goals through natural, friendly conversation — like a trusted friend who happens to know finance, not a bank form.

Rules:
- Respond in simple, clear English. Avoid jargon; explain any financial term you use.
- Ask only ONE follow-up question per message. Never overwhelm.
- Be warm and encouraging — many users are anxious about investing.
- After gathering goal, time horizon, risk tolerance, and monthly budget, output a structured profile.
- Never recommend specific assets during onboarding — save that for the dashboard.
- Always append: "⚠️ Saaradhi provides AI-generated insights for educational purposes only, not SEBI-registered financial advice."

When you have enough information, end your response with this exact XML block:
<PROFILE_EXTRACTED>
{
  "goal": "string description of goal",
  "goal_amount": number or null,
  "time_horizon_years": number,
  "risk_tolerance": "conservative" | "moderate" | "aggressive",
  "monthly_investment": number or null,
  "existing_investments": "string or null"
}
</PROFILE_EXTRACTED>

Variables available: {history} {user_message}
```

### 9.2 Recommendation Rationale Prompt
**Key:** `recommendation_rationale`

```
You are Saaradhi's recommendation engine. Generate a single clear sentence explaining why this specific asset suits this specific user's profile. Be concrete — reference their actual goal and a real data point from the asset.

Format: "Recommended for your {goal} — {specific data-backed reason}. | AI insight, not financial advice."
Maximum length: 30 words total.
Tone: Confident and informative. Never say "buy" or "sell".

User Profile: {user_profile}
Asset Data: {asset_data_json}
```

### 9.3 Co-Pilot System Prompt
**Key:** `copilot_system`

```
You are Saaradhi, an AI financial co-pilot for Indian retail investors. You help users understand stocks, mutual funds, ETFs, FDs, and market conditions with clarity and honesty.

Rules:
- Use simple English. Explain financial terms when first used.
- Ground every answer in the real data provided — never invent numbers.
- Structure longer answers with bullet points (3 max) for readability.
- Be honest about uncertainty — say "I don't have enough data on this" rather than guessing.
- Never make definitive buy/sell recommendations.
- Keep responses concise — under 200 words unless the question genuinely requires more.
- Always end with: "⚠️ AI-generated research for educational purposes. Not SEBI-registered financial advice."

User context:
Goal: {goal} | Risk profile: {risk_tolerance} | Time horizon: {time_horizon_years} years

Real-time market data:
{market_data_json}

Conversation history (last 5 turns):
{conversation_history}

User question: {user_message}
```

### 9.4 Portfolio Insight Prompt
**Key:** `portfolio_insight`

```
You are Saaradhi's portfolio analyst. Review this user's holdings and generate a brief, honest health assessment.

Focus on:
1. Sector concentration risk (if any)
2. Alignment with their stated goal and time horizon
3. One specific, actionable observation (not a recommendation — an observation)

Maximum length: 150 words. Plain English only.
End with: "⚠️ AI-generated insight, not SEBI-registered advice."

User profile: {user_profile}
Portfolio holdings: {portfolio_json}
```

---

## 10. Data Pipeline

### Stock Data (Python + yfinance)

```python
# python-service/services/yfinance_service.py
import yfinance as yf

def get_stock_data(symbol: str) -> dict:
    """symbol format: 'HDFCBANK.NS' for NSE, 'HDFCBANK.BO' for BSE"""
    ticker = yf.Ticker(symbol)
    info   = ticker.info
    hist   = ticker.history(period="30d")

    return {
        "symbol":         symbol,
        "name":           info.get("longName"),
        "price":          info.get("currentPrice"),
        "change_pct":     round((info.get("52WeekChange") or 0) * 100, 2),
        "pe_ratio":       info.get("trailingPE"),
        "de_ratio":       info.get("debtToEquity"),
        "eps":            info.get("trailingEps"),
        "market_cap":     info.get("marketCap"),
        "sector":         info.get("sector"),
        "one_year_return":round((info.get("52WeekChange") or 0) * 100, 2),
        "sparkline":      hist["Close"].tolist()[-10:],
    }

# Curated stock universe by risk profile
STOCK_UNIVERSE = {
    "conservative": [
        "HDFCBANK.NS", "INFY.NS", "TCS.NS", "NESTLEIND.NS",
        "HINDUNILVR.NS", "ITC.NS", "KOTAKBANK.NS", "WIPRO.NS"
    ],
    "moderate": [
        "TATAMOTORS.NS", "AXISBANK.NS", "SUNPHARMA.NS", "MARUTI.NS",
        "TITAN.NS", "ASIANPAINT.NS", "LT.NS", "BAJFINANCE.NS"
    ],
    "aggressive": [
        "ADANIENT.NS", "ZOMATO.NS", "IRCTC.NS", "POLICYBZR.NS",
        "NYKAA.NS", "DELHIVERY.NS", "PAYTM.NS", "MOTHERSON.NS"
    ]
}
```

### Mutual Fund Data (MFAPI.in — free)

```python
# python-service/services/mfapi_service.py
import httpx

async def get_mf_data(scheme_code: str) -> dict:
    url = f"https://api.mfapi.in/mf/{scheme_code}"
    async with httpx.AsyncClient() as client:
        r = await client.get(url)
        data = r.json()

    nav_history  = data["data"][:30]
    current_nav  = float(nav_history[0]["nav"])
    nav_30d_ago  = float(nav_history[-1]["nav"])
    return_30d   = ((current_nav - nav_30d_ago) / nav_30d_ago) * 100

    return {
        "scheme_code": scheme_code,
        "name":        data["meta"]["scheme_name"],
        "fund_house":  data["meta"]["fund_house"],
        "category":    data["meta"]["scheme_category"],
        "nav":         current_nav,
        "return_30d":  round(return_30d, 2),
        "sparkline":   [float(d["nav"]) for d in reversed(nav_history)]
    }

# Curated MF universe by risk profile (use MFAPI scheme codes)
MF_UNIVERSE = {
    "conservative": [
        "120503",  # HDFC Liquid Fund
        "120716",  # SBI Debt Fund
        "118701",  # Axis Liquid Fund
    ],
    "moderate": [
        "120503",  # HDFC Balanced Advantage
        "119598",  # Mirae Asset Hybrid
        "120716",  # Axis Balanced Advantage
    ],
    "aggressive": [
        "120503",  # Nippon India Small Cap
        "118701",  # Axis Small Cap Fund
        "119598",  # SBI Small Cap Fund
    ]
}
```

### Sentiment Scoring (NewsAPI + TextBlob)

```python
# python-service/services/news_service.py
import httpx
from textblob import TextBlob
import os

async def get_sentiment(query: str) -> dict:
    url = "https://newsapi.org/v2/everything"
    params = {
        "q":        f"{query} stock India NSE",
        "language": "en",
        "sortBy":   "publishedAt",
        "pageSize": 10,
        "apiKey":   os.getenv("NEWS_API_KEY")
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        articles = r.json().get("articles", [])

    headlines = [a["title"] for a in articles if a.get("title")]
    scores    = [TextBlob(h).sentiment.polarity for h in headlines]
    avg_score = sum(scores) / len(scores) if scores else 0.0

    return {
        "sentiment_score": round(avg_score, 3),   # -1.0 (bearish) to 1.0 (bullish)
        "headlines":       headlines[:5],
        "article_count":   len(articles)
    }
```

### FD Rates (static, update monthly)

```python
# python-service/services/fd_service.py
# Update from: https://www.rbi.org.in and bank websites

FD_RATES = {
    "SBI":            {"1yr": 6.80, "2yr": 7.00, "3yr": 6.75, "5yr": 6.50},
    "HDFC Bank":      {"1yr": 6.60, "2yr": 7.00, "3yr": 7.00, "5yr": 7.00},
    "ICICI Bank":     {"1yr": 6.70, "2yr": 7.00, "3yr": 7.00, "5yr": 7.00},
    "Bajaj Finance":  {"1yr": 7.40, "2yr": 7.80, "3yr": 8.05, "5yr": 8.05},
    "Axis Bank":      {"1yr": 6.70, "2yr": 7.10, "3yr": 7.10, "5yr": 7.00},
}
```

---

## 11. Freemium & Auth Logic

### NeonDB-based usage check

```javascript
// backend/src/middleware/freemium.middleware.js
import { query } from '../config/db.js';

const FREE_LIMITS = {
  copilot_query:            5,
  recommendation_refresh:   1,
};

export const checkFreemiumLimit = (feature) => async (req, res, next) => {
  if (req.user.plan === 'pro') return next();

  const today = new Date().toISOString().split('T')[0];
  const result = await query(
    `SELECT COUNT(*) FROM usage_tracking
     WHERE user_id = $1 AND feature = $2 AND date = $3`,
    [req.user.id, feature, today]
  );

  const count = parseInt(result.rows[0].count);
  const limit = FREE_LIMITS[feature];

  if (count >= limit) {
    return res.status(429).json({
      error:       `Daily limit reached — ${limit} ${feature.replace('_', ' ')}s for free users`,
      used:        count,
      limit,
      upgrade_url: '/subscription'
    });
  }

  await query(
    `INSERT INTO usage_tracking (user_id, feature) VALUES ($1, $2)`,
    [req.user.id, feature]
  );

  next();
};
```

### Claude call with automatic logging

```javascript
// backend/src/services/claudeService.js
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../config/db.js';
import { calculateCost } from '../../shared/claudePricing.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude({
  userId, sessionId, turnNumber, feature,
  promptKey, promptVersion, systemPrompt,
  messages, injectedContext = {}
}) {
  const t0 = Date.now();
  let claudeResponse = null;
  let error = null;

  try {
    const response = await client.messages.create({
      model:      process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      system:     systemPrompt,
      messages,
    });
    claudeResponse = response.content[0].text;

    const tokens    = response.usage;
    const costs     = calculateCost(tokens.input_tokens, tokens.output_tokens);
    const latencyMs = Date.now() - t0;

    // Fire-and-forget logging — never blocks user response
    query(`
      INSERT INTO query_logs (
        user_id, session_id, feature, turn_number,
        user_message, system_prompt_key, prompt_version, injected_context,
        claude_response, input_tokens, output_tokens, total_tokens, model,
        input_cost_usd, output_cost_usd, total_cost_usd, cost_inr,
        latency_ms, flags
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        userId, sessionId, feature, turnNumber,
        messages.at(-1)?.content, promptKey, promptVersion,
        JSON.stringify(injectedContext), claudeResponse,
        tokens.input_tokens, tokens.output_tokens,
        tokens.input_tokens + tokens.output_tokens,
        process.env.CLAUDE_MODEL,
        costs.inputCost, costs.outputCost, costs.totalUsd, costs.totalInr,
        latencyMs, []
      ]
    ).catch(console.error);

    // Update session totals
    query(
      `SELECT increment_session_totals($1,$2,$3,$4,$5)`,
      [sessionId, tokens.input_tokens, tokens.output_tokens, costs.totalInr, latencyMs]
    ).catch(console.error);

  } catch (err) {
    error = err.message;
    // Log the error too
    query(
      `INSERT INTO query_logs (user_id, session_id, feature, error, latency_ms)
       VALUES ($1,$2,$3,$4,$5)`,
      [userId, sessionId, feature, err.message, Date.now() - t0]
    ).catch(console.error);
    throw err;
  }

  return claudeResponse;
}
```

### Shared cost calculator

```javascript
// shared/claudePricing.js
const PRICING = {
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 }  // USD per million tokens
};
const USD_TO_INR = 83.5;

export function calculateCost(inputTokens, outputTokens, model = 'claude-sonnet-4-6') {
  const p = PRICING[model];
  const inputCost  = (inputTokens  / 1_000_000) * p.input;
  const outputCost = (outputTokens / 1_000_000) * p.output;
  const totalUsd   = inputCost + outputCost;
  return {
    inputCost,
    outputCost,
    totalUsd,
    totalInr: parseFloat((totalUsd * USD_TO_INR).toFixed(4))
  };
}
```

---

## 12. SEBI Disclaimer Architecture

Legal protection baked into every layer.

### Rules:
1. **Persistent top banner** — visible on every page, never dismissible
2. **Inline on every card** — last line of every rationale
3. **Pre-chat notice** — shown before first Co-Pilot message in a session
4. **Onboarding consent checkbox** — must check before profile is saved
5. **Dedicated `/disclaimer` page** — full legal text

```jsx
// components/common/DisclaimerBanner.jsx
export const DisclaimerBanner = () => (
  <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
    <p className="font-sans text-xs text-amber-800 text-center">
      ⚠️ Saaradhi provides AI-generated research for <strong>educational purposes only</strong>.
      This is <strong>not SEBI-registered investment advice</strong>.{' '}
      <a href="/disclaimer" className="underline font-medium">Full disclaimer →</a>
    </p>
  </div>
);
```

```jsx
// Onboarding consent — required field
<label className="flex items-start gap-3 cursor-pointer">
  <input
    type="checkbox"
    required
    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500"
    onChange={(e) => setConsented(e.target.checked)}
  />
  <span className="font-sans text-xs text-gray-500 leading-relaxed">
    I understand that Saaradhi's recommendations are AI-generated research insights
    for educational purposes only. They are <strong>not SEBI-registered financial advice</strong>.
    I will not make investment decisions solely based on this platform.
  </span>
</label>
```

---

## 13. Build, Deploy & Hosting

### Local development

```bash
# Frontend
cd frontend && npm install && npm run dev        # http://localhost:3000

# Backend
cd backend && npm install && npm run dev         # http://localhost:5000

# Python service
cd python-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000            # http://localhost:8000

# Admin portal
cd admin-portal && npm install && npm run dev    # http://localhost:3001
```

### requirements.txt (Python)
```
fastapi==0.110.0
uvicorn==0.29.0
yfinance==0.2.38
httpx==0.27.0
textblob==0.18.0
pandas==2.2.1
python-dotenv==1.0.1
```

### package.json — backend key deps
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.5",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "express-session": "^1.17.3",
    "connect-pg-simple": "^9.0.1",
    "@anthropic-ai/sdk": "^0.24.0",
    "node-cache": "^5.1.2",
    "axios": "^1.7.0",
    "razorpay": "^2.9.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "bcryptjs": "^2.4.3"
  }
}
```

### package.json — frontend key deps
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "axios": "^1.7.0",
    "zustand": "^4.5.0",
    "recharts": "^2.12.0",
    "framer-motion": "^11.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### Deployment architecture

```
saradhi.katakam.in          → Vercel Project 1 (frontend/)
saradhi-admin.katakam.in    → Vercel Project 2 (admin-portal/)
api.saradhi.katakam.in      → Railway (backend/)
                                  └── /admin/api/* routes included here
python.saradhi.katakam.in   → Railway (python-service/) [internal only]
Database                    → Your existing NeonDB instance
```

**Vercel setup for second project:**
1. Go to vercel.com → New Project
2. Import same Git repo
3. Set Root Directory to `admin-portal/`
4. Add env variables
5. Set custom domain to `saradhi-admin.katakam.in`
That's it — Vercel handles the rest.

**Estimated monthly infra cost:**
| Service | Cost |
|---|---|
| Vercel (both projects) | Free |
| Railway (Node + Python) | ~₹850 |
| NeonDB | Free tier |
| NewsAPI | ~₹4,000 |
| **Total** | **~₹4,850/month** |

---

## 14. Phase-wise Roadmap

### Phase 1 — Core MVP (Weeks 1–3)
- [ ] Monorepo scaffold (frontend + backend + python-service + admin-portal)
- [ ] NeonDB schema — all tables from Section 5
- [ ] Seed initial prompt templates into `prompt_templates` table
- [ ] Google OAuth login (Passport.js)
- [ ] Conversational onboarding → risk profile extracted + saved
- [ ] Python service: yfinance stock data endpoint
- [ ] Recommendation generation (Claude-powered, 3 cards for free)
- [ ] RecommendationCard UI with IBM Plex fonts
- [ ] SEBI disclaimer banner + onboarding consent
- [ ] `claudeService.js` with automatic query logging
- [ ] Landing page at `saradhi.katakam.in`
- [ ] Deploy frontend → Vercel, backend → Railway

### Phase 2 — Co-Pilot & Freemium (Weeks 4–6)
- [ ] Co-Pilot chat UI with SSE streaming
- [ ] NewsAPI + TextBlob sentiment scoring
- [ ] Freemium usage tracking + rate limiting
- [ ] Razorpay Pro subscription (₹299/month)
- [ ] Mutual fund data (MFAPI.in)
- [ ] ETF recommendations
- [ ] FD rates comparison view
- [ ] Admin portal: login + query log table + token costs
- [ ] Admin portal: Prompt Studio with Monaco editor

### Phase 3 — Portfolio & Broker (Weeks 7–10)
- [ ] Portfolio dashboard (manual entry first)
- [ ] AI portfolio health insights
- [ ] Risk alerts (Pro tier)
- [ ] Zerodha Kite Connect integration
- [ ] Investment goals tracker with progress
- [ ] Admin analytics: conversation depth + cost projections

### Phase 4 — Growth (Post-launch)
- [ ] SEBI RIA registration
- [ ] WhatsApp bot (large Indian user base on WhatsApp)
- [ ] Hindi language support (IBM Plex Sans supports Devanagari)
- [ ] React Native mobile app
- [ ] Groww / Upstox broker integrations
- [ ] PWA offline support

---

*Version 2.0 | Domain: saradhi.katakam.in | DB: NeonDB | Admin: see saaradhi_admin_spec.md*
