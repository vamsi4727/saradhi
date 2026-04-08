# Saaradhi — Admin Portal Specification
> Internal operations dashboard for monitoring, prompt management, and analytics  
> Domain: `admin.saradhi.katakam.in` | Auth: Simple password (single admin login)  
> Companion doc: `saaradhi_main_spec.md` (Main Application)

---

## Table of Contents
1. [Overview & Access](#1-overview--access)
2. [Admin Portal Structure](#2-admin-portal-structure)
3. [Module 1 — Prompt Management Studio](#3-module-1--prompt-management-studio)
4. [Module 2 — Query Log Explorer](#4-module-2--query-log-explorer)
5. [Module 3 — Token Cost Analytics](#5-module-3--token-cost-analytics)
6. [Module 4 — Conversation Depth Analytics](#6-module-4--conversation-depth-analytics)
7. [Module 5 — User Management](#7-module-5--user-management)
8. [Module 6 — System Health](#8-module-6--system-health)
9. [API Contracts — Admin Routes](#9-api-contracts--admin-routes)
10. [Admin Auth Implementation](#10-admin-auth-implementation)
11. [Security Notes](#11-security-notes)
12. [Build & Deploy](#12-build--deploy)

---

## 1. Overview & Access

The Saaradhi Admin Portal lives at `admin.saradhi.katakam.in` — a completely separate Vercel project from the main app. It shares the same Node.js backend (`api.saradhi.katakam.in`) but hits `/admin/api/*` routes protected by admin-only middleware.

### What the admin portal does
- **Prompt Studio** — edit every Claude prompt live without redeploying
- **Query Logs** — read every user query + AI response with token details
- **Token Analytics** — exact cost per query, per feature, per day
- **Conversation Analytics** — turn depth, drop-off points, most asked topics
- **User Management** — view users, upgrade/downgrade plans, reset limits
- **System Health** — API error rates, latency, service status

### Access Model — Simple Single Admin Login

**One admin account. Password only. No OAuth, no 2FA. Keep it simple.**  
You are the only operator right now. Complexity can be added later if needed.

```
URL:      https://admin.saradhi.katakam.in
Password: set via ADMIN_PASSWORD_HASH env variable on Railway
Session:  8-hour timeout, auto-expires
```

The password is bcrypt-hashed and stored as an env variable — never in the database.  
To change it: update the env variable on Railway, redeploy. Done in 2 minutes.

---

## 2. Admin Portal Structure

```
admin-portal/                         ← Vercel Project 2
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx                 ← Simple password form
│   │   ├── Overview.jsx              ← Home: key stats at a glance
│   │   ├── PromptStudio.jsx          ← Edit + version + test prompts
│   │   ├── QueryLogs.jsx             ← Filterable query log table
│   │   ├── ConversationDetail.jsx    ← Full conversation thread view
│   │   ├── TokenAnalytics.jsx        ← Cost breakdown charts
│   │   ├── ConversationAnalytics.jsx ← Depth + funnel + topics
│   │   ├── UserManagement.jsx        ← User list + actions
│   │   └── SystemHealth.jsx          ← Service status + errors
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminSidebar.jsx
│   │   │   └── AdminTopbar.jsx
│   │   ├── prompts/
│   │   │   ├── PromptEditor.jsx      ← Monaco editor
│   │   │   ├── PromptVersionList.jsx
│   │   │   └── PromptTestPanel.jsx   ← Live test against Claude
│   │   ├── logs/
│   │   │   ├── QueryLogTable.jsx
│   │   │   ├── LogFilters.jsx
│   │   │   ├── ConversationThread.jsx
│   │   │   └── TokenBadge.jsx
│   │   ├── analytics/
│   │   │   ├── StatCard.jsx
│   │   │   ├── CostChart.jsx
│   │   │   ├── TurnDepthChart.jsx
│   │   │   └── FunnelChart.jsx
│   │   └── common/
│   │       ├── DataTable.jsx
│   │       ├── DateRangePicker.jsx
│   │       └── ExportButton.jsx      ← CSV export
│   │
│   └── services/
│       └── adminApi.js               ← Axios to /admin/api/*
│
├── .env.local
└── package.json
```

**Backend additions** (same Node.js Express app, no new service needed):

```
backend/src/
├── routes/
│   └── admin.routes.js
├── controllers/
│   ├── admin.logs.controller.js
│   ├── admin.prompts.controller.js
│   ├── admin.analytics.controller.js
│   └── admin.users.controller.js
└── middleware/
    └── adminAuth.middleware.js
```

---

## 3. Module 1 — Prompt Management Studio

**The most important admin feature.** All Claude prompts are stored in NeonDB — not hardcoded. When Claude gives a bad answer, fix the prompt here in 30 seconds, live within 5 minutes (cache TTL). No redeployment.

### Prompts managed here

| Prompt Key | Used In | Description |
|---|---|---|
| `onboarding_system` | Onboarding chat | Risk profiling personality + extraction rules |
| `recommendation_rationale` | Dashboard cards | One-line AI rationale per asset |
| `copilot_system` | Co-Pilot chat | Co-Pilot personality, rules, context injection |
| `portfolio_insight` | Portfolio page | AI portfolio health commentary |
| `risk_alert` | Pro tier alerts | Risk alert message generation |

### Prompt Studio UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  PROMPT STUDIO                                              │
├───────────────┬─────────────────────────────────────────────┤
│               │  copilot_system                    v3 ▼    │
│ onboarding_   │  ─────────────────────────────────────────  │
│   system      │  SYSTEM PROMPT                              │
│               │  ┌─────────────────────────────────────┐   │
│ recommend_    │  │ You are Saaradhi, an AI financial   │   │
│   rationale   │  │ co-pilot for Indian investors...    │   │
│               │  │                                     │   │
│ copilot_      │  │  [Monaco Editor]                    │   │
│   system  ◀── │  │                                     │   │
│               │  └─────────────────────────────────────┘   │
│ portfolio_    │                                             │
│   insight     │  Variables: {user_profile} {market_data}   │
│               │  {conversation_history} {user_message}      │
│ risk_alert    │                                             │
│               │  ┌─────────────────────────────────────┐   │
│               │  │ TEST PANEL                          │   │
│               │  │ Message: [________________________] │   │
│               │  │ [▶ Run Test]                        │   │
│               │  │ Response: ...                       │   │
│               │  │ Tokens: 847 in / 312 out  ₹0.0024  │   │
│               │  └─────────────────────────────────────┘   │
│               │                                             │
│               │  [Save Draft]  [Publish v4]  [Revert]      │
└───────────────┴─────────────────────────────────────────────┘
```

### Version History

```
Version History: copilot_system
────────────────────────────────────────────
v3  │ Published │ Today 14:32    │ [Active ✓]
v2  │ Published │ Yesterday      │ [Rollback]
v1  │ Published │ 3 days ago     │ [Rollback]
────────────────────────────────────────────
[Compare v3 vs v2]
```

### How Node.js loads prompts from NeonDB

```javascript
// backend/src/services/promptService.js
import { query } from '../config/db.js';

const promptCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getActivePrompt(promptKey) {
  const cached = promptCache.get(promptKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.prompt;
  }

  const result = await query(
    `SELECT system_prompt, user_prompt_template, variables, version
     FROM prompt_templates
     WHERE prompt_key = $1 AND is_active = TRUE
     LIMIT 1`,
    [promptKey]
  );

  const prompt = result.rows[0];
  promptCache.set(promptKey, { prompt, fetchedAt: Date.now() });
  return prompt;
}

// Called by admin publish endpoint — takes effect within seconds
export function clearPromptCache(promptKey) {
  promptCache.delete(promptKey);
}
```

---

## 4. Module 2 — Query Log Explorer

Every Claude API call is automatically logged by `claudeService.js` (see `saaradhi_main_spec.md` Section 11). This module lets you explore those logs.

### What each log entry shows

```
Query Log:
────────────────────────────────────────────────────────────
ID         : uuid
Time       : 2025-03-13 14:32:07 IST
User       : an***@gmail.com  [FREE]
Feature    : copilot
Session    : uuid
Turn       : 3 of 5

USER MESSAGE:
"What are the risks of investing in Adani Green right now?"

SYSTEM PROMPT: copilot_system v3

INJECTED CONTEXT (expandable):
  user_profile: { goal: "retirement", risk: "moderate", horizon: 15 }
  market_data:  { ADANIGREEN.NS: { pe: 94.2, sentiment: -0.31 } }

CLAUDE RESPONSE:
"While Adani Green has strong long-term renewable energy positioning,
current risks include:
• High debt-to-equity ratio (8.4x vs sector avg 3.1x)
• Recent regulatory news creating short-term price pressure
⚠️ AI-generated research, not SEBI-registered advice."

TOKEN METRICS:
  Input:   1,247 tokens   ₹0.022
  Output:    312 tokens   ₹0.034
  Total:   1,559 tokens   ₹0.056
  Latency: 2,840ms
────────────────────────────────────────────────────────────
```

### Query Log Table

```
┌────────────────────────────────────────────────────────────────┐
│  QUERY LOGS                                      [Export CSV]  │
├────────────────────────────────────────────────────────────────┤
│  [Date Range] [Feature ▼] [Plan ▼] [Flag ▼] [Search]          │
├──────────┬──────────────┬───────────┬──────┬────────┬─────────┤
│ Time     │ User         │ Feature   │ Turn │ Tokens │ Cost    │
├──────────┼──────────────┼───────────┼──────┼────────┼─────────┤
│ 14:32:07 │ an***@g.com  │ copilot   │  3   │  1,559 │  ₹0.06  │
│ 14:28:41 │ ra***@g.com  │ recommend │  1   │  3,201 │ ₹0.18 💰 │
│ 14:21:09 │ pr***@g.com  │ onboarding│  6   │  4,102 │  ₹0.22  │
│ 14:15:33 │ an***@g.com  │ copilot   │  1   │    892 │  ₹0.04  │
│ 14:08:22 │ su***@g.com  │ copilot   │  2   │    987 │ ₹0.05 ⚠️ │
└──────────┴──────────────┴───────────┴──────┴────────┴─────────┘
  478 queries today                     Page 1 of 48
```

💰 = high cost flag | ⚠️ = error flag

**Clicking a row** → Conversation Detail: full session as chat bubbles, token badge per turn, injected context expandable.

### Auto-flagging logic

```javascript
// backend/src/utils/queryFlagger.js
export function flagQuery({ total_tokens, cost_inr, latency_ms, error }) {
  const flags = [];
  if (total_tokens > 3000)    flags.push('high_token');
  if (cost_inr > 0.15)        flags.push('high_cost');
  if (latency_ms > 8000)      flags.push('slow_response');
  if (error)                  flags.push('error');
  if (!error && total_tokens < 200) flags.push('short_response');
  return flags;
}
```

---

## 5. Module 3 — Token Cost Analytics

```
┌─────────────────────────────────────────────────────────┐
│  TOKEN & COST ANALYTICS              [This Month ▼]     │
├────────────┬────────────┬──────────────┬────────────────┤
│ Total Cost │ Avg/Query  │ Total Queries│ Total Tokens   │
│  ₹1,847    │  ₹0.068    │   27,163     │   27.1M        │
└────────────┴────────────┴──────────────┴────────────────┘

Daily Cost (Recharts BarChart — last 30 days)

By Feature:
  Co-Pilot        62%  ₹1,145   ████████████████░
  Recommendations 28%  ₹517     ████████░░░░░░░░░
  Onboarding       8%  ₹148     ███░░░░░░░░░░░░░░
  Portfolio        2%  ₹37       █░░░░░░░░░░░░░░░

By User Plan:
  Free users      41%  ₹757     ████████████░░░░░
  Pro users       59%  ₹1,090   █████████████████

Cost Projection:
  Spent so far (13 days):   ₹1,847
  Projected full month:     ₹4,262
  Pro revenue (12 × ₹299):  ₹3,588
  Net position:             -₹674 ← break-even at ~22 Pro users

Top Expensive Users This Month:
  ra***@g.com   48 queries   ₹87.20  [PRO]
  an***@g.com   31 queries   ₹61.90  [FREE ⚠️ upsell opportunity]
```

### Claude pricing reference (used for calculations)

```javascript
// shared/claudePricing.js
export const CLAUDE_PRICING = {
  'claude-sonnet-4-6': {
    input_per_million:  3.00,   // USD
    output_per_million: 15.00,  // USD
  }
};
export const USD_TO_INR = 83.5;
```

---

## 6. Module 4 — Conversation Depth Analytics

```
┌─────────────────────────────────────────────────────────┐
│  CONVERSATION ANALYTICS              [This Month ▼]     │
├─────────────────────────────────────────────────────────┤
│  ONBOARDING FUNNEL                                      │
│  Started            1,247  ████████████████  100%       │
│  Reached turn 2     1,110  ██████████████░░   89%       │
│  Reached turn 4       835  █████████████░░░   67%       │
│  Profile extracted    673  ████████████░░░░   54%       │
│  Confirmed + saved    599  ███████████░░░░░   48%       │
│                                                         │
│  Avg turns to complete: 4.2   Avg time: 6.4 min        │
│  ⚠️ Most common drop-off: After turn 3 (budget Q)      │
│  → Consider softening the budget question in prompt     │
│                                                         │
│  CO-PILOT SESSION DEPTH                                 │
│  1 turn (single Q)    ████████████████░░░  52%         │
│  2–3 turns            ████████████░░░░░░░  31%         │
│  4–6 turns            █████░░░░░░░░░░░░░░  12%         │
│  7+ turns (deep dive) ██░░░░░░░░░░░░░░░░░   5%         │
│                                                         │
│  TOP QUERY TOPICS:                                     │
│  1. Stock analysis     38%                             │
│  2. MF / SIP advice    24%                             │
│  3. Market conditions  15%                             │
│  4. Financial concepts 12%                             │
│  5. Portfolio advice   11%                             │
│                                                         │
│  MOST ASKED ABOUT:                                     │
│  HDFCBANK  ADANIENT  Nifty 50  TATAMOTORS  ZOMATO      │
└─────────────────────────────────────────────────────────┘
```

The drop-off insight (turn 3 during onboarding) directly feeds into Prompt Studio — if users consistently abandon when asked about their budget, tweak that question in `onboarding_system`.

---

## 7. Module 5 — User Management

### User List

```
┌──────────────────────────────────────────────────────────┐
│  USERS  (247 total — 12 Pro, 235 Free)    [Export CSV]  │
├─────────────────────────────────────────────────────────┤
│  [Plan ▼] [Onboarded ▼] [Joined ▼] [Search email]      │
├──────────────┬──────┬──────────┬─────────┬─────────────┤
│ User         │ Plan │ Joined   │ Queries │ Cost (₹)    │
├──────────────┼──────┼──────────┼─────────┼─────────────┤
│ ra***@g.com  │ PRO  │ 10 Mar   │   48    │   ₹87.20    │
│ an***@g.com  │ FREE │ 12 Mar   │   31    │   ₹61.90 ⚠️  │
│ pr***@g.com  │ FREE │ 11 Mar   │    5    │    ₹2.10    │
└──────────────┴──────┴──────────┴─────────┴─────────────┘
```

### User Detail (click any row)

```
User: an***@gmail.com    [full email visible here]
Plan: FREE  │  Joined: March 12  │  Last active: 2 hours ago

Risk Profile:
  Goal: Child's higher education  │  Horizon: 8yr  │  Risk: Moderate
  Monthly budget: ₹10,000  │  Onboarding: Complete ✓

Usage This Month:
  Total queries: 31  │  Co-Pilot: 28  │  Recommendations: 3
  Total tokens: 9,102  │  Total cost to us: ₹61.90
  Avg queries/day: 7.75  ← heavy free user, consider upsell

Actions:
  [Upgrade to Pro]  [Reset Daily Limit]  [Suspend]  [View All Queries]
```

### Admin actions
- **Upgrade to Pro** — manually grant Pro (beta testers, early partners)
- **Reset daily limit** — delete today's usage_tracking rows (support action)
- **Suspend** — set `is_suspended=true`, blocks login
- **View all queries** — full conversation history for this user

---

## 8. Module 6 — System Health

```
┌─────────────────────────────────────────────────────────┐
│  SYSTEM HEALTH                      Live (60s refresh)  │
├──────────────┬────────────┬──────────────┬─────────────┤
│ Service      │ Status     │ Avg Latency  │ Error Rate  │
├──────────────┼────────────┼──────────────┼─────────────┤
│ Node.js API  │ 🟢 Online  │    142ms     │    0.2%     │
│ Python Svc   │ 🟢 Online  │    890ms     │    1.1%     │
│ Claude API   │ 🟢 Online  │   2,840ms    │    0.0%     │
│ NeonDB       │ 🟢 Online  │     45ms     │    0.0%     │
│ NewsAPI      │ 🟡 Slow    │   4,200ms    │    8.3%     │
└──────────────┴────────────┴──────────────┴─────────────┘

Recent Errors (last 1 hour):
  14:28  yfinance timeout      TATAMOTORS.NS   [View]
  14:15  NewsAPI rate limit    429 Too Many     [View]
```

---

## 9. API Contracts — Admin Routes

All on the same Node.js Express app. All protected by `adminAuth.middleware.js`.

### Auth
```
POST /admin/api/auth/login        Body: { password }  → sets admin session cookie
POST /admin/api/auth/logout       Clears admin session
GET  /admin/api/auth/check        200 if valid session, 401 if not
```

### Prompt Management
```
GET    /admin/api/prompts                    List all prompt keys + active version
GET    /admin/api/prompts/:key               All versions for a key
GET    /admin/api/prompts/:key/active        Currently active prompt
POST   /admin/api/prompts/:key               Save new draft
POST   /admin/api/prompts/:key/publish       Make a version active, clear cache
POST   /admin/api/prompts/:key/rollback/:v   Re-activate version v, clear cache
POST   /admin/api/prompts/test               Call Claude live with draft prompt
DELETE /admin/api/prompts/draft/:id          Delete an unpublished draft
```

### Query Logs
```
GET  /admin/api/logs
     Params: page, limit, feature, plan, flag, date_from, date_to, search
     Response: { logs: [], total, page, pages }

GET  /admin/api/logs/:id              Full log entry
GET  /admin/api/logs/session/:id      All logs for session (conversation thread)
GET  /admin/api/logs/export           CSV download with same filters as /logs
```

### Token Analytics
```
GET  /admin/api/analytics/tokens
     Params: period (7d | 30d | this_month)
     Response: {
       total_cost_inr, avg_cost_per_query, total_queries, total_tokens,
       daily: [{ date, cost_inr, query_count }],
       by_feature: [{ feature, cost_inr, pct }],
       by_plan: [{ plan, cost_inr, pct }],
       top_users: [{ email_masked, queries, cost_inr, plan }],
       projection: { current_spend, projected_monthly, pro_revenue, net }
     }
```

### Conversation Analytics
```
GET  /admin/api/analytics/conversations
     Response: {
       onboarding_funnel: [{ turn, count, pct }],
       copilot_depth_distribution: [{ bucket, count, pct }],
       avg_turns_onboarding,
       avg_turns_copilot,
       common_dropoff_turn,
       top_topics: [{ topic, pct }],
       top_mentioned_assets: [{ name, count }]
     }
```

### User Management
```
GET  /admin/api/users                 Params: page, plan, search
GET  /admin/api/users/:id             Detail + risk profile + usage summary
GET  /admin/api/users/:id/logs        User's query logs (paginated)
POST /admin/api/users/:id/upgrade     Set plan='pro'
POST /admin/api/users/:id/reset-limit Delete today's usage_tracking for user
POST /admin/api/users/:id/suspend     Set is_suspended=true
POST /admin/api/users/:id/unsuspend   Set is_suspended=false
```

### System Health
```
GET  /admin/api/health
     Response: {
       services: [{ name, status, latency_p50_ms, error_rate_1h }],
       recent_errors: [{ time, service, message, log_id }]
     }
```

---

## 10. Admin Auth Implementation

```javascript
// backend/src/middleware/adminAuth.middleware.js
import bcrypt from 'bcryptjs';

export const adminLogin = async (req, res) => {
  const { password } = req.body;

  // ADMIN_PASSWORD_HASH is set in Railway env vars
  // Generate with: node -e "console.log(require('bcryptjs').hashSync('yourpassword', 12))"
  const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  req.session.isAdmin = true;
  req.session.adminLoginAt = Date.now();
  res.json({ success: true });
};

export const requireAdmin = (req, res, next) => {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  // 8-hour session timeout
  const eightHours = 8 * 60 * 60 * 1000;
  if (Date.now() - req.session.adminLoginAt > eightHours) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Session expired — please log in again' });
  }

  next();
};
```

**Separate session config in Express** — admin sessions never mix with user sessions:

```javascript
// backend/src/index.js
import session from 'express-session';

// User sessions (for /api/*)
app.use('/api', session({
  name:             'saradhi_user',
  secret:           process.env.SESSION_SECRET,
  resave:           false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// Admin sessions (for /admin/api/*) — different secret, different cookie name
app.use('/admin/api', session({
  name:             'saradhi_admin',
  secret:           process.env.ADMIN_SESSION_SECRET,
  resave:           false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 }
}));
```

**Wire up admin routes:**

```javascript
// backend/src/routes/admin.routes.js
import { Router } from 'express';
import { adminLogin, requireAdmin } from '../middleware/adminAuth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit login — prevent brute force
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post('/auth/login',  loginLimiter, adminLogin);
router.post('/auth/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });
router.get('/auth/check',   requireAdmin, (req, res) => res.json({ authenticated: true }));

// All other admin routes require auth
router.use(requireAdmin);

// Prompts
router.get('/prompts',                      promptsController.list);
router.get('/prompts/:key',                 promptsController.getVersions);
router.get('/prompts/:key/active',          promptsController.getActive);
router.post('/prompts/:key',                promptsController.saveDraft);
router.post('/prompts/:key/publish',        promptsController.publish);
router.post('/prompts/:key/rollback/:v',    promptsController.rollback);
router.post('/prompts/test',                promptsController.test);

// Logs
router.get('/logs',                         logsController.list);
router.get('/logs/export',                  logsController.export);
router.get('/logs/:id',                     logsController.detail);
router.get('/logs/session/:sessionId',      logsController.session);

// Analytics
router.get('/analytics/tokens',             analyticsController.tokens);
router.get('/analytics/conversations',      analyticsController.conversations);

// Users
router.get('/users',                        usersController.list);
router.get('/users/:id',                    usersController.detail);
router.get('/users/:id/logs',              usersController.logs);
router.post('/users/:id/upgrade',          usersController.upgrade);
router.post('/users/:id/reset-limit',      usersController.resetLimit);
router.post('/users/:id/suspend',          usersController.suspend);
router.post('/users/:id/unsuspend',        usersController.unsuspend);

// Health
router.get('/health',                       healthController.status);

export default router;
```

---

## 11. Security Notes

Practical precautions that are worth doing without overcomplicating:

**1. CORS lock** — `/admin/api/*` only accepts requests from `admin.saradhi.katakam.in`.
```javascript
app.use('/admin/api', cors({ origin: process.env.ADMIN_PORTAL_URL, credentials: true }));
```

**2. Separate session secrets** — `ADMIN_SESSION_SECRET` ≠ `SESSION_SECRET`. Different env var, different cookie name.

**3. Email masking in log tables** — show `an***@gmail.com` in table views. Full email only on User Detail page.

**4. Rate limit login** — 10 attempts per 15 minutes. Prevents brute force.

**5. Rate limit Prompt Test panel** — 20 test calls per hour. Prevents accidental runaway Claude costs.

**6. Don't index admin domain** — add to `admin-portal/public/robots.txt`:
```
User-agent: *
Disallow: /
```

---

## 12. Build & Deploy

### Admin portal setup

```bash
npm create vite@latest admin-portal -- --template react
cd admin-portal && npm install

npm install axios zustand react-router-dom
npm install recharts
npm install @monaco-editor/react
npm install date-fns react-datepicker
npm install tailwindcss @tailwindcss/forms autoprefixer postcss
```

### Additional backend deps

```bash
cd backend
npm install bcryptjs express-rate-limit
```

### Environment variables

```env
# backend/.env — add to existing
ADMIN_PASSWORD_HASH=generate_with_bcrypt_see_below
ADMIN_SESSION_SECRET=long_random_string_different_from_SESSION_SECRET
ADMIN_PORTAL_URL=https://admin.saradhi.katakam.in
```

```env
# admin-portal/.env.local
VITE_ADMIN_API_URL=https://api.saradhi.katakam.in/admin/api
```

**Generating ADMIN_PASSWORD_HASH:**
```bash
node -e "const b = require('bcryptjs'); console.log(b.hashSync('your_chosen_password', 12))"
# Paste the output into Railway env vars as ADMIN_PASSWORD_HASH
```

### Vercel deployment — Project 2

1. Vercel dashboard → **Add New Project**
2. Import same Git repository as the main app
3. Set **Root Directory** → `admin-portal/`
4. Add env variables
5. Set custom domain → `admin.saradhi.katakam.in`
6. Deploy

Completely independent from your main Vercel project. Same repo, different root directory.

### Build phases

**Phase 1** (alongside main MVP — Weeks 1–3):
- [ ] NeonDB tables already in main spec (query_logs, conversation_sessions, prompt_templates)
- [ ] `claudeService.js` auto-logging wired into every Claude call
- [ ] Seed initial prompts into `prompt_templates` table (version 1, is_active=true)
- [ ] Admin auth (password, bcrypt, sessions, rate limit)
- [ ] Basic Query Log table (read-only, filterable)
- [ ] Token cost badge per log entry
- [ ] Deploy admin portal to Vercel Project 2

**Phase 2** (Weeks 4–6):
- [ ] Prompt Studio: Monaco editor + version history + publish/rollback
- [ ] Prompt test panel (live Claude call + token display)
- [ ] Token analytics charts (Recharts)
- [ ] Conversation depth analytics + onboarding funnel
- [ ] User management + actions

**Phase 3** (Weeks 7–10):
- [ ] System health dashboard
- [ ] Cost projection panel
- [ ] CSV export for logs and user list
- [ ] Topic extraction from Co-Pilot queries

---

*Version 2.0 | Domain: admin.saradhi.katakam.in | DB: NeonDB (same instance as main app)*  
*For main application spec, see: `saaradhi_main_spec.md`*
