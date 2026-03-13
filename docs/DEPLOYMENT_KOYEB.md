# Deploying Saradhi to Koyeb

Your project has **two separate parts** that must be deployed as **two Koyeb services**:

| Service | What it runs | URL |
|--------|--------------|-----|
| **Frontend** | React/Vite (static files) | `expensive-ardelis-nextlevelpvtlimited-fcb91010.koyeb.app` |
| **Backend** | Node.js Express API | **You need to deploy this** → e.g. `saradhi-api-xxx.koyeb.app` |

The 404 on `/api/auth/me` happens because the frontend Koyeb app serves only static files—it has no Express backend. The API must run on a **separate** service.

---

## Step 1: Deploy the Backend to Koyeb

1. In [Koyeb Dashboard](https://app.koyeb.com/), click **Create App** → **GitHub**
2. Select your repository
3. **Source**: Set **Root directory** to `backend` (so Koyeb builds from the backend folder)
4. **Builder**: Choose **Buildpack** (auto-detects Node.js)
5. **Run command**: Leave default or set to `npm start`
6. **Instance type**: Nano or Small (free tier if available)

### Environment variables (set in Koyeb → your service → Variables)

Copy from `backend/.env.example` and fill in production values:

```
PORT=8000
NODE_ENV=production
DATABASE_URL=postgresql://...  (your NeonDB connection string)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
CALLBACK_URL=https://YOUR-BACKEND-URL.koyeb.app/api/auth/google/callback
FRONTEND_URL=https://saradhi.katakam.in
PYTHON_SERVICE_URL=...  (if you deploy python-service separately)
ANTHROPIC_API_KEY=...
ADMIN_PASSWORD_HASH=...
ADMIN_SESSION_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

Replace `YOUR-BACKEND-URL` with the Koyeb-assigned URL (e.g. `saradhi-api-xxx`).

7. Deploy → Koyeb will assign a URL like `https://saradhi-api-xyz123.koyeb.app`

---

## Step 2: Point Frontend to the Backend

The frontend must call the **backend** URL, not itself.

### If frontend is on Vercel (saradhi.katakam.in)

In Vercel → Project → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://YOUR-BACKEND-URL.koyeb.app
```

(e.g. `https://saradhi-api-xyz123.koyeb.app` — **no trailing slash**)

### If frontend is on Koyeb (expensive-ardelis-...)

In Koyeb → your frontend service → Variables:

```
VITE_API_BASE_URL=https://YOUR-BACKEND-URL.koyeb.app
```

Redeploy the frontend after adding this variable.

---

## Step 3: Custom Domain for Backend (Optional)

To use `api.saradhi.katakam.in` instead of the Koyeb URL:

1. In Koyeb → your **backend** service → Settings → Domains → Add `api.saradhi.katakam.in`
2. In Cloudflare (or your DNS): Add CNAME `api` → `YOUR-BACKEND-URL.koyeb.app`
3. Update `VITE_API_BASE_URL` to `https://api.saradhi.katakam.in`
4. Update Google OAuth redirect URI to `https://api.saradhi.katakam.in/api/auth/google/callback`
5. Update backend env: `CALLBACK_URL=https://api.saradhi.katakam.in/api/auth/google/callback`

---

## Step 4: Google OAuth

Add your **backend** URL to Google Cloud Console → OAuth client:

- **Authorized redirect URI**: `https://YOUR-BACKEND-URL.koyeb.app/api/auth/google/callback`
- (Or `https://api.saradhi.katakam.in/api/auth/google/callback` if using custom domain)

---

## Quick reference

| Problem | Solution |
|---------|----------|
| 404 on `/api/auth/me` | Deploy backend as a separate Koyeb service |
| Frontend loading, API not working | Set `VITE_API_BASE_URL` to the backend URL |
| CORS errors | Set `FRONTEND_URL` in backend env to your frontend origin |
