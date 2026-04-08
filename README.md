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
├── frontend/       → React + Vite (local :2718)
├── backend/        → Node.js Express (local :6626)
├── python-service/ → FastAPI + yfinance (local :8000)
├── admin-portal/   → Admin dashboard
├── shared/         → Shared constants
└── db/             → Schema + seed scripts
```

## Production deployment (reference)

Use this section when you return to the project after a break. **DNS** for `katakam.in` is managed in **Cloudflare**.

| Piece | Platform | Public URL / notes |
|--------|-----------|-------------------|
| Web app | **Vercel** | `https://saradhi.katakam.in` (custom domain on Vercel) |
| REST API (Node/Express) | **Koyeb** | `https://api.saradhi.katakam.in` (custom domain on Koyeb; CNAME in Cloudflare) |
| Python service | **Koyeb** | Same Koyeb **app** as the API, separate **service** (e.g. `saradhi-python`); often not public—called by the Node backend |
| Admin portal | **Vercel** (2nd project) | `https://admin.saradhi.katakam.in` — see Cloudflare steps below |

Koyeb also assigns a default `*.koyeb.app` URL per app/service; keep that URL in **Google OAuth** redirect URIs if you still use it for debugging.

**Step-by-step Koyeb env vars, `VITE_API_BASE_URL`, and custom domain DNS:** see [`docs/DEPLOYMENT_KOYEB.md`](docs/DEPLOYMENT_KOYEB.md).

### Admin portal: `admin.saradhi.katakam.in` (Cloudflare + Vercel)

Same pattern as `api.saradhi.katakam.in`, but the admin UI is static on **Vercel**, so DNS points to Vercel—not Koyeb.

1. **Vercel** (admin project, root `admin-portal/`): **Settings → Domains →** add `admin.saradhi.katakam.in`. Copy the exact DNS targets Vercel shows (often a **CNAME** to `cname.vercel-dns.com`).

2. **Cloudflare** (zone **`katakam.in`**):
   - **Type:** CNAME  
   - **Name:** `admin.saradhi` (this is the `admin.saradhi` label before `.katakam.in`)  
   - **Target:** value from Vercel (e.g. `cname.vercel-dns.com`)  
   - **Proxy:** **DNS only** (grey cloud) is the usual choice with Vercel so SSL and routing stay straightforward.

3. **Koyeb (API):** set `ADMIN_PORTAL_URL=https://admin.saradhi.katakam.in` and redeploy/restart so CORS allows the admin origin.

4. **Vercel (admin project) env:** `VITE_ADMIN_API_URL=https://api.saradhi.katakam.in/admin/api` (no trailing slash), then redeploy.

**Production-oriented env (high level):**

- **Vercel (main frontend):** `VITE_API_BASE_URL=https://api.saradhi.katakam.in` (no trailing slash)
- **Vercel (admin portal):** `VITE_ADMIN_API_URL=https://api.saradhi.katakam.in/admin/api`
- **Koyeb (backend):** `CALLBACK_URL=https://api.saradhi.katakam.in/api/auth/google/callback`, `FRONTEND_URL=https://saradhi.katakam.in`, `ADMIN_PORTAL_URL=https://admin.saradhi.katakam.in`, plus `DATABASE_URL`, OAuth secrets, `PYTHON_SERVICE_URL` (internal Koyeb URL if Python is private), etc.—mirror `backend/.env.example`
- **Google Cloud Console:** Authorized redirect URI must include `https://api.saradhi.katakam.in/api/auth/google/callback` (and any `*.koyeb.app` callback URLs you still use)

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
