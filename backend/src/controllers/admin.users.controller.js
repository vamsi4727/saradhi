import { query } from '../config/db.js';

function maskEmail(email) {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return '—';
  return local.slice(0, 2) + '***@' + domain;
}

export async function list(req, res) {
  try {
    const { page = 1, limit = 20, plan, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = ['1=1'];
    const params = [];
    let paramIdx = 1;

    if (plan) {
      conditions.push(`plan = $${paramIdx++}`);
      params.push(plan);
    }
    if (search) {
      conditions.push(`email ILIKE $${paramIdx++}`);
      params.push(`%${search}%`);
    }

    const whereClause = conditions.join(' AND ');
    const countResult = await query(
      `SELECT COUNT(*)::int FROM users WHERE ${whereClause}`,
      params
    );
    const total = countResult.rows[0]?.count ?? 0;

    params.push(Number(limit), offset);
    const result = await query(
      `SELECT u.id, u.email, u.plan, u.created_at,
        (SELECT COUNT(*) FROM query_logs ql WHERE ql.user_id = u.id AND ql.created_at >= date_trunc('month', CURRENT_DATE)) as queries_this_month,
        (SELECT COALESCE(SUM(cost_inr), 0) FROM query_logs ql WHERE ql.user_id = u.id AND ql.created_at >= date_trunc('month', CURRENT_DATE)) as cost_this_month
       FROM users u
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    const users = result.rows.map((r) => ({
      id: r.id,
      email_masked: maskEmail(r.email),
      email: r.email,
      plan: r.plan,
      created_at: r.created_at,
      queries_this_month: parseInt(r.queries_this_month, 10) || 0,
      cost_this_month: parseFloat(r.cost_this_month) || 0,
    }));

    const pages = Math.ceil(total / Number(limit)) || 1;
    res.json({ users, total, page: Number(page), pages });
  } catch (err) {
    console.error('admin users list:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function detail(req, res) {
  try {
    const { id } = req.params;
    const userResult = await query(
      `SELECT id, email, name, plan, created_at, is_suspended
       FROM users WHERE id = $1`,
      [id]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profileResult = await query(
      `SELECT goal, time_horizon_years, risk_tolerance, monthly_investment, completed
       FROM risk_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id]
    );
    const profile = profileResult.rows[0];

    const usageResult = await query(
      `SELECT COUNT(*)::int as queries, SUM(total_tokens)::int as tokens, SUM(cost_inr)::float as cost
       FROM query_logs WHERE user_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [id]
    );
    const usage = usageResult.rows[0];

    const byFeature = await query(
      `SELECT feature, COUNT(*)::int FROM query_logs WHERE user_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)
       GROUP BY feature`,
      [id]
    );

    res.json({
      user: {
        ...user,
        email_masked: maskEmail(user.email),
      },
      risk_profile: profile || null,
      usage: {
        total_queries: usage?.queries || 0,
        total_tokens: usage?.tokens || 0,
        total_cost: parseFloat(usage?.cost) || 0,
        by_feature: Object.fromEntries(byFeature.rows.map((r) => [r.feature, r.count])),
      },
    });
  } catch (err) {
    console.error('admin users detail:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export async function logs(req, res) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const countResult = await query(
      `SELECT COUNT(*)::int FROM query_logs WHERE user_id = $1`,
      [id]
    );
    const total = countResult.rows[0]?.count ?? 0;

    const result = await query(
      `SELECT id, created_at, feature, turn_number, total_tokens, cost_inr, user_message, claude_response
       FROM query_logs WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, Number(limit), offset]
    );

    const pages = Math.ceil(total / Number(limit)) || 1;
    res.json({ logs: result.rows, total, page: Number(page), pages });
  } catch (err) {
    console.error('admin users logs:', err);
    res.status(500).json({ error: 'Failed to fetch user logs' });
  }
}

export async function upgrade(req, res) {
  try {
    const { id } = req.params;
    await query(`UPDATE users SET plan = 'pro', updated_at = NOW() WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('admin users upgrade:', err);
    res.status(500).json({ error: 'Failed to upgrade user' });
  }
}

export async function resetLimit(req, res) {
  try {
    const { id } = req.params;
    await query(
      `DELETE FROM usage_tracking WHERE user_id = $1 AND date = CURRENT_DATE`,
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('admin users resetLimit:', err);
    res.status(500).json({ error: 'Failed to reset limit' });
  }
}

export async function suspend(req, res) {
  try {
    const { id } = req.params;
    await query(`UPDATE users SET is_suspended = TRUE, updated_at = NOW() WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('admin users suspend:', err);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
}

export async function unsuspend(req, res) {
  try {
    const { id } = req.params;
    await query(`UPDATE users SET is_suspended = FALSE, updated_at = NOW() WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('admin users unsuspend:', err);
    res.status(500).json({ error: 'Failed to unsuspend user' });
  }
}
