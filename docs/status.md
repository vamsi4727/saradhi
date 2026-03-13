# Saaradhi — Project Status

> Last updated: March 2026

---

## Overview

This document tracks the implementation status of the Saaradhi financial co-pilot application and its admin portal.

---

## 1. Admin Portal

### Auth
- [x] Simple password-only login (bcrypt, single admin)
- [x] 8-hour session timeout with separate `saradhi_admin` cookie
- [x] Rate-limited login (10 attempts / 15 min)
- [x] CORS configured for `ADMIN_PORTAL_URL`

### Backend
- [x] Admin routes at `/admin/api/*`
- [x] **Logs**: List, detail, session, CSV export (filters: page, limit, feature, plan, date, search)
- [x] **Prompts**: List, versions, active, save draft, publish, rollback, live test
- [x] **Analytics**: Token cost (daily, by feature, by plan, top users, projection), conversation funnel & depth
- [x] **Users**: List, detail, logs, upgrade, reset limit, suspend, unsuspend
- [x] **Health**: Service status, DB latency, recent errors

### Admin Portal Frontend
- [x] Login page
- [x] layout: Sidebar, topbar, logout
- [x] Overview: Stats cards
- [x] Prompt Studio: Monaco editor, version history, test panel

- [x] Query Logs: Table, pagination, export CSV
- [x] Token Analytics: Recharts, daily cost, by feature/plan, projection, top users
- [x] Conversation Analytics: Onboarding funnel, Co-Pilot session depth
- [x] User Management: List, detail panel, actions (upgrade, reset limit, suspend)
- [x] System Health: Service status, recent errors

### Admin UI
- [x] Lucide React icons (replaced emojis)
- [x] Dark theme, JetBrains Mono + DM Sans fonts

---

## 2. Main Application

### User Auth
- [x] Google OAuth
- [x] Session-based auth (user sessions)

### Onboarding
- [x] Chat-based onboarding with 4 questions
- [x] Fields: goal, risk appetite, time horizon, monthly budget
- [x] AI extracts profile and outputs `<PROFILE_EXTRACTED>` JSON
- [x] PROFILE_EXTRACTED block stripped from chat display
- [x] Profile saved to `risk_profiles` table
- [x] Save confirmation + loading state
- [x] Consent checkbox before save

### Dashboard (For You)
- [x] Fetches recommendations from API
- [x] `has_profile` flag: shows "Profile saved successfully!" when profile exists but recommendations empty
- [x] "Complete onboarding" only when no profile

### Profile Page
- [x] View mode: Account + Risk Profile display
- [x] Edit mode: Form fields for goal, goal_amount, time_horizon_years, risk_tolerance, monthly_investment, existing_investments
- [x] Edit / Save / Cancel buttons
- [x] Delete: Removes profile + recommendations, redirects to onboarding

### Co-Pilot
- [x] Chat interface
- [x] Uses `copilot_system` prompt
- [x] Freemium limit (5 queries/day for free)

### Recommendations
- [x] Generated from risk profile + Python service (stocks)
- [x] Uses `recommendation_rationale` prompt for AI rationale

---

## 3. Backend

### Infrastructure
- [x] Express + PostgreSQL (NeonDB)
- [x] Session store: `connect-pg-simple` for user sessions
- [x] Claude API integration via `claudeService.js`

### Claude
- [x] Model: `claude-sonnet-4-6` (fixed from invalid `claude-haiku-20250219`)
- [x] Query logging to `query_logs`
- [x] Cost calculation: `shared/claudePricing.js`

### Prompts
- [x] Stored in `prompt_templates` table
- [x] `promptService.js`: 5-min cache, `getActivePrompt`, `clearPromptCache`
- [x] Keys: `onboarding_system`, `recommendation_rationale`, `copilot_system`, `portfolio_insight`

### User Routes
- [x] GET /api/user/profile
- [x] POST /api/user/profile (create)
- [x] PUT /api/user/profile (update)
- [x] DELETE /api/user/profile (delete profile + recommendations)

---

## 4. Database

### Tables
- [x] `users`
- [x] `risk_profiles`
- [x] `recommendations`
- [x] `usage_tracking`
- [x] `subscriptions`
- [x] `conversation_sessions`
- [x] `query_logs`
- [x] `prompt_templates`
- [x] `admin_audit_log`

### Migrations
- [x] `db/seed_prompts.sql` — seed initial prompts
- [x] `db/migrations/001_update_onboarding_prompt.sql` — update onboarding prompt for structured flow

---

## 5. UI / UX

### Icons
- [x] Lucide React icons (main app + admin)
- [x] Replaced emoji icons in nav, sidebar, cards

### Branding
- [x] TrendingUp logo mark with "Saaradhi" branding
- [x] Disclaimer banner with AlertTriangle icon

---

## 6. Not Yet Implemented

- [ ] `portfolio_insight` prompt used — wired for Portfolio page
- [ ] `risk_alert` prompt — Pro tier alerts
- [ ] Python service (stocks, sentiment) — recommendations may fail if not running
- [ ] System health: Python service, Claude latency metrics
- [ ] CSV export for logs and users in admin
- [ ] Topic extraction from Co-Pilot queries

---

## 7. Quick Reference

| Component | URL / Port |
|-----------|------------|
| Main app | http://localhost:2718 |
| Admin portal | http://localhost:5174 |
| Backend API | http://localhost:6626 |

### Env vars (backend)
- `CLAUDE_MODEL` — `claude-sonnet-4-6`
- `ADMIN_PASSWORD_HASH` — bcrypt hash of admin password
- `ADMIN_SESSION_SECRET` — for admin session signing
- `ADMIN_PORTAL_URL` — http://localhost:5174 (dev)

---

*For detailed specs, see `docs/scope/saaradhi_main_spec.md` and `docs/scope/saaradhi_admin_spec.md`.*
