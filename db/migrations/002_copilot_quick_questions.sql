-- Co-Pilot suggested questions with hardcoded answers
-- Shown as "Try asking" in Co-Pilot; when user selects, return stored answer

CREATE TABLE IF NOT EXISTS copilot_quick_questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question   TEXT NOT NULL UNIQUE,
  answer     TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_quick_questions_sort ON copilot_quick_questions(sort_order);

-- Seed default 5 questions (run once; safe to re-run with ON CONFLICT)
INSERT INTO copilot_quick_questions (question, answer, sort_order) VALUES
  (
    'Summarize Tata Motors'' latest earnings',
    'Tata Motors reported strong results in its latest quarter. Revenue grew on the back of robust JLR (Jaguar Land Rover) performance and improving domestic passenger vehicle demand. Key highlights: improved margins, debt reduction, and positive outlook for the EV segment. *AI-generated research for educational purposes. Not SEBI-registered financial advice.*',
    1
  ),
  (
    'Compare HDFC Bank vs ICICI Bank for 5 years',
    'Over the past 5 years, both HDFC Bank and ICICI Bank have delivered solid returns. HDFC Bank has traditionally been valued at a premium for its asset quality and retail focus. ICICI Bank has seen a strong turnaround in asset quality and growth. Compare on metrics like ROE, NPA ratios, and growth rates before deciding. *AI-generated research for educational purposes. Not SEBI-registered financial advice.*',
    2
  ),
  (
    'Best SIP options for ₹5,000/month?',
    'For a ₹5,000/month SIP, consider a mix of large-cap, mid-cap, and flexi-cap funds based on your risk profile. Popular options include index funds (Nifty 50, Sensex) for stability, and actively managed funds for potential alpha. Diversify across 2–3 funds and stay invested for at least 5–7 years. *AI-generated research for educational purposes. Not SEBI-registered financial advice.*',
    3
  ),
  (
    'Is Nifty 50 overvalued right now?',
    'Nifty 50 valuation can be assessed using P/E ratio (historical average ~20) and P/B ratio. When P/E is above 25, the market is often considered stretched. Check current Nifty P/E on NSE or financial sites. Also watch FII flows, India GDP growth, and global factors like US Fed rates. *AI-generated research for educational purposes. Not SEBI-registered financial advice.*',
    4
  ),
  (
    'Explain P/E ratio in simple terms',
    'P/E (Price-to-Earnings) ratio = Share Price ÷ Earnings per Share. It tells you how many years of current earnings you pay for one share. A P/E of 15 means you pay 15 times one year of earnings. Lower P/E can mean cheaper (or troubled) stock; higher P/E can mean growth expectations. Compare with sector and historical averages. *AI-generated research for educational purposes. Not SEBI-registered financial advice.*',
    5
  )
ON CONFLICT (question) DO NOTHING;
