import { query } from '../config/db.js';

function maskEmail(email) {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return '—';
  return local.slice(0, 2) + '***@' + domain;
}

export async function tokens(req, res) {
  try {
    const { period = 'this_month' } = req.query;

    let dateFilter = "created_at >= date_trunc('month', CURRENT_DATE)";
    if (period === 'all') {
      dateFilter = '1=1';
    } else if (period === '7d') {
      dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === '30d') {
      dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const summary = await query(
      `SELECT
        COALESCE(SUM(cost_inr), 0)::float as total_cost_inr,
        COUNT(*)::int as total_queries,
        COALESCE(SUM(total_tokens), 0)::int as total_tokens
       FROM query_logs WHERE ${dateFilter}`
    );
    const s = summary.rows[0];
    const total_cost_inr = parseFloat(s.total_cost_inr) || 0;
    const total_queries = s.total_queries || 0;
    const total_tokens = s.total_tokens || 0;
    const avg_cost_per_query = total_queries ? total_cost_inr / total_queries : 0;

    const daily = await query(
      `SELECT created_at::date as date, SUM(cost_inr)::float as cost_inr, COUNT(*)::int as query_count
       FROM query_logs WHERE ${dateFilter}
       GROUP BY created_at::date ORDER BY date`
    );

    const byFeature = await query(
      `SELECT feature, SUM(cost_inr)::float as cost_inr
       FROM query_logs WHERE ${dateFilter}
       GROUP BY feature ORDER BY cost_inr DESC`
    );
    const byFeatureList = byFeature.rows.map((r) => ({
      feature: r.feature,
      cost_inr: parseFloat(r.cost_inr) || 0,
      pct: total_cost_inr ? ((parseFloat(r.cost_inr) || 0) / total_cost_inr) * 100 : 0,
    }));

    const dateFilterQl = dateFilter.replace('created_at', 'ql.created_at');
    const byPlan = await query(
      `SELECT u.plan, COALESCE(SUM(ql.cost_inr), 0)::float as cost_inr
       FROM query_logs ql
       LEFT JOIN users u ON ql.user_id = u.id
       WHERE ${dateFilterQl}
       GROUP BY u.plan`
    );
    const byPlanList = byPlan.rows.map((r) => ({
      plan: r.plan || 'unknown',
      cost_inr: parseFloat(r.cost_inr) || 0,
      pct: total_cost_inr ? ((parseFloat(r.cost_inr) || 0) / total_cost_inr) * 100 : 0,
    }));

    const topUsers = await query(
      `SELECT u.email, u.plan, COUNT(*)::int as queries, SUM(ql.cost_inr)::float as cost_inr
       FROM query_logs ql
       JOIN users u ON ql.user_id = u.id
       WHERE ${dateFilterQl}
       GROUP BY u.id, u.email, u.plan
       ORDER BY cost_inr DESC LIMIT 10`
    );

    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dayOfMonth = new Date().getDate();
    const projected_monthly = dayOfMonth ? (total_cost_inr / dayOfMonth) * daysInMonth : total_cost_inr;
    const proCount = await query(`SELECT COUNT(*)::int FROM users WHERE plan = 'pro'`);
    const pro_revenue = (proCount.rows[0]?.count || 0) * 299;

    res.json({
      total_cost_inr,
      avg_cost_per_query,
      total_queries,
      total_tokens,
      daily: daily.rows.map((r) => ({
        date: r.date,
        cost_inr: parseFloat(r.cost_inr) || 0,
        query_count: r.query_count,
      })),
      by_feature: byFeatureList,
      by_plan: byPlanList,
      top_users: topUsers.rows.map((r) => ({
        email_masked: maskEmail(r.email),
        queries: r.queries,
        cost_inr: parseFloat(r.cost_inr) || 0,
        plan: r.plan,
      })),
      projection: {
        current_spend: total_cost_inr,
        projected_monthly,
        pro_revenue,
        net: pro_revenue - projected_monthly,
      },
    });
  } catch (err) {
    console.error('admin analytics tokens:', err);
    res.status(500).json({ error: 'Failed to fetch token analytics' });
  }
}

export async function conversations(req, res) {
  try {
    const dateFilter = "created_at >= date_trunc('month', CURRENT_DATE)";

    const onboardingTurns = await query(
      `SELECT turn_number as turn, COUNT(*)::int as count
       FROM query_logs WHERE feature = 'onboarding' AND ${dateFilter}
       GROUP BY turn_number ORDER BY turn_number`
    );
    const maxOnboarding = await query(
      `SELECT MAX(turn_number)::int as m FROM query_logs WHERE feature = 'onboarding' AND ${dateFilter}`
    );
    const maxTurn = maxOnboarding.rows[0]?.m || 0;
    const started = await query(
      `SELECT COUNT(DISTINCT session_id)::int FROM query_logs WHERE feature = 'onboarding' AND ${dateFilter}`
    );
    const startedCount = started.rows[0]?.count || 0;

    const funnel = [];
    for (let t = 1; t <= maxTurn; t++) {
      const row = onboardingTurns.rows.find((r) => parseInt(r.turn, 10) === t);
      const count = row ? row.count : 0;
      funnel.push({
        turn: t,
        count,
        pct: startedCount ? (count / startedCount) * 100 : 0,
      });
    }

    const copilotDepth = await query(
      `SELECT
        CASE
          WHEN total_turns = 1 THEN '1 turn'
          WHEN total_turns BETWEEN 2 AND 3 THEN '2-3 turns'
          WHEN total_turns BETWEEN 4 AND 6 THEN '4-6 turns'
          ELSE '7+ turns'
        END as bucket,
        COUNT(*)::int as count
       FROM (
         SELECT session_id, MAX(turn_number) as total_turns
         FROM query_logs WHERE feature = 'copilot' AND ${dateFilter}
         GROUP BY session_id
       ) s
       GROUP BY bucket
       ORDER BY MIN(total_turns)`
    );

    const totalCopilot = copilotDepth.rows.reduce((a, r) => a + r.count, 0);

    res.json({
      onboarding_funnel: funnel,
      copilot_depth_distribution: copilotDepth.rows.map((r) => ({
        bucket: r.bucket,
        count: r.count,
        pct: totalCopilot ? (r.count / totalCopilot) * 100 : 0,
      })),
      avg_turns_onboarding: funnel.length ? funnel.reduce((a, f) => a + f.turn * f.count, 0) / funnel.reduce((a, f) => a + f.count, 0) : 0,
      common_dropoff_turn: funnel.length > 1 ? funnel.find((f, i) => i > 0 && f.count < funnel[i - 1].count)?.turn : null,
      top_topics: [],
      top_mentioned_assets: [],
    });
  } catch (err) {
    console.error('admin analytics conversations:', err);
    res.status(500).json({ error: 'Failed to fetch conversation analytics' });
  }
}
