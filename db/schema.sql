-- ================================================================
-- Saaradhi — NeonDB Schema
-- Run in NeonDB SQL editor
-- ================================================================

-- USER-FACING TABLES
CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS risk_profiles (
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

CREATE TABLE IF NOT EXISTS recommendations (
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

CREATE TABLE IF NOT EXISTS usage_tracking (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  feature   TEXT,
  used_at   TIMESTAMPTZ DEFAULT NOW(),
  date      DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT,
  plan                     TEXT DEFAULT 'pro',
  status                   TEXT DEFAULT 'active',
  started_at               TIMESTAMPTZ DEFAULT NOW(),
  expires_at               TIMESTAMPTZ
);

-- ADMIN & LOGGING TABLES
CREATE TABLE IF NOT EXISTS conversation_sessions (
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

CREATE TABLE IF NOT EXISTS query_logs (
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

CREATE TABLE IF NOT EXISTS prompt_templates (
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

CREATE UNIQUE INDEX IF NOT EXISTS one_active_prompt_per_key
  ON prompt_templates(prompt_key)
  WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_query_logs_user_id ON query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_session_id ON query_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_feature ON query_logs(feature);
CREATE INDEX IF NOT EXISTS idx_query_logs_created_at ON query_logs(created_at DESC);

-- HELPER FUNCTION
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
