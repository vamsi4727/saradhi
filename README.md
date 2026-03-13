# Saaradhi — AI-Powered Financial Co-Pilot

AI-powered financial co-pilot for Indian retail investors. See `docs/scope/saaradhi_main_spec.md` for full specification.

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` in each service and fill in your values:

```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env

# Python service
cp python-service/.env.example python-service/.env
```

### 2. Database (NeonDB)

Schema and seed prompts have been applied. If starting fresh:
1. Run `db/schema.sql` in Neon SQL editor
2. Run `db/seed_prompts.sql`
3. Add `DATABASE_URL` to `backend/.env`

### 3. Install & Run (Local)

```bash
npm install
cd python-service && pip install -r requirements.txt && cd ..

# Run in 3 terminals:
npm run dev:python    # Terminal 1: Python on :8000
npm run dev:backend  # Terminal 2: Node on :6626
npm run dev:frontend # Terminal 3: Vite on :2718
```

- **Frontend:** http://localhost:2718
- **Backend API:** http://localhost:6626

### 4. Google OAuth

1. Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/)
2. Add authorized redirect URI: `http://localhost:6626/api/auth/google/callback`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`

### 5. Claude API

1. Get API key from [Anthropic](https://console.anthropic.com/)
2. Set `ANTHROPIC_API_KEY` in `backend/.env`

## Project Structure

```
saradhi/
├── frontend/       → React + Vite → saradhi.katakam.in (Vercel)
├── backend/        → Node.js Express → api.saradhi.katakam.in (Render)
├── python-service/ → FastAPI + yfinance (internal)
├── admin-portal/   → Admin dashboard (saradhi-admin.katakam.in)
├── shared/         → Shared constants
└── db/             → Schema + seed scripts
```

## Deployment (saradhi.katakam.in)

- **Frontend:** Vercel → `saradhi.katakam.in`
- **Backend:** Render.com → `api.saradhi.katakam.in`

Before deploying, update `.env` for production:
- `CALLBACK_URL` → `https://api.saradhi.katakam.in/api/auth/google/callback`
- `FRONTEND_URL` → `https://saradhi.katakam.in`

## Pre-requisites (.env)

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | backend | NeonDB connection string |
| `GOOGLE_CLIENT_ID` | backend, frontend | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | backend | Google OAuth |
| `SESSION_SECRET` | backend | Session encryption |
| `ANTHROPIC_API_KEY` | backend | Claude API |
| `ADMIN_PASSWORD_HASH` | backend | bcrypt hash of admin password |
| `NEWS_API_KEY` | python-service | NewsAPI (Phase 2) |

Generate admin password hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('yourpassword', 12))"
```
