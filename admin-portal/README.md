# Saaradhi Admin Portal

Internal operations dashboard for monitoring, prompt management, and analytics.

## Quick Start

```bash
# Install dependencies (if not done)
npm install

# Start dev server (port 5174)
npm run dev
```

Admin portal: http://localhost:5174

## Auth

- **Simple password:** One admin account, no username
- **Session:** 8-hour timeout, auto-expires
- **Dev password:** `admin123` (set in backend `.env` via `ADMIN_PASSWORD_HASH`)

To change password: generate a new hash and update `ADMIN_PASSWORD_HASH` in backend:

```bash
node -e "console.log(require('bcryptjs').hashSync('yourpassword', 12))"
```

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_ADMIN_API_URL` | API base (default: `/admin/api` — uses Vite proxy in dev) |

## Backend

Ensure backend `.env` has:

- `ADMIN_PASSWORD_HASH` — bcrypt hash of password
- `ADMIN_SESSION_SECRET` — random string for session signing
- `ADMIN_PORTAL_URL` — http://localhost:5174 (dev) or https://admin.saradhi.katakam.in (prod)
