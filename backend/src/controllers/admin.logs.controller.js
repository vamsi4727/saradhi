import { query } from '../config/db.js';

function maskEmail(email) {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return '—';
  const masked = local.slice(0, 2) + '***';
  return `${masked}@${domain}`;
}

export async function list(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      feature,
      plan,
      flag,
      date_from,
      date_to,
      search,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const conditions = ['1=1'];
    const params = [];
    let paramIdx = 1;

    if (feature) {
      conditions.push(`ql.feature = $${paramIdx++}`);
      params.push(feature);
    }
    if (date_from) {
      conditions.push(`ql.created_at >= $${paramIdx++}`);
      params.push(date_from);
    }
    if (date_to) {
      conditions.push(`ql.created_at::date <= $${paramIdx++}`);
      params.push(date_to);
    }
    if (search) {
      conditions.push(`(ql.user_message ILIKE $${paramIdx} OR ql.claude_response ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (flag) {
      conditions.push(`$${paramIdx} = ANY(ql.flags)`);
      params.push(flag);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');
    let joinClause = 'LEFT JOIN users u ON ql.user_id = u.id';
    if (plan) {
      joinClause = `JOIN users u ON ql.user_id = u.id AND u.plan = $${paramIdx}`;
      params.push(plan);
      paramIdx++;
    }

    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM query_logs ql ${joinClause} WHERE ${whereClause}`,
      params
    );
    const total = countResult.rows[0]?.total ?? 0;

    params.push(Number(limit), offset);
    const logsResult = await query(
      `SELECT ql.id, ql.created_at, ql.feature, ql.turn_number, ql.total_tokens,
        ql.cost_inr, ql.user_message, ql.flags, u.email, u.plan
       FROM query_logs ql
       ${joinClause}
       WHERE ${whereClause}
       ORDER BY ql.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    const logs = logsResult.rows.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      feature: r.feature,
      turn: r.turn_number,
      total_tokens: r.total_tokens,
      cost_inr: r.cost_inr ? parseFloat(r.cost_inr) : null,
      user_masked: maskEmail(r.email),
      plan: r.plan,
      flags: r.flags || [],
    }));

    const pages = Math.ceil(total / Number(limit)) || 1;

    res.json({ logs, total, page: Number(page), pages });
  } catch (err) {
    console.error('admin logs list:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
}

export async function detail(req, res) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT ql.*, u.email, u.plan
       FROM query_logs ql
       LEFT JOIN users u ON ql.user_id = u.id
       WHERE ql.id = $1`,
      [id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Log not found' });

    res.json({
      ...row,
      user_masked: maskEmail(row.email),
      email: row.email,
    });
  } catch (err) {
    console.error('admin log detail:', err);
    res.status(500).json({ error: 'Failed to fetch log' });
  }
}

export async function session(req, res) {
  try {
    const { sessionId } = req.params;
    const result = await query(
      `SELECT ql.*, u.email
       FROM query_logs ql
       LEFT JOIN users u ON ql.user_id = u.id
       WHERE ql.session_id = $1
       ORDER BY ql.turn_number ASC`,
      [sessionId]
    );

    const logs = result.rows.map((r) => ({
      ...r,
      user_masked: maskEmail(r.email),
    }));

    res.json({ logs });
  } catch (err) {
    console.error('admin logs session:', err);
    res.status(500).json({ error: 'Failed to fetch session logs' });
  }
}

export async function exportCsv(req, res) {
  try {
    const { feature, date_from, date_to } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let paramIdx = 1;

    if (feature) {
      conditions.push(`ql.feature = $${paramIdx++}`);
      params.push(feature);
    }
    if (date_from) {
      conditions.push(`ql.created_at >= $${paramIdx++}`);
      params.push(date_from);
    }
    if (date_to) {
      conditions.push(`ql.created_at::date <= $${paramIdx++}`);
      params.push(date_to);
    }

    const result = await query(
      `SELECT ql.created_at, ql.feature, ql.turn_number, ql.total_tokens, ql.cost_inr,
        u.email, ql.user_message, ql.claude_response
       FROM query_logs ql
       LEFT JOIN users u ON ql.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ql.created_at DESC
       LIMIT 5000`,
      params
    );

    const headers = ['Time', 'Feature', 'Turn', 'Tokens', 'Cost (₹)', 'User', 'User Message', 'Response'];
    const rows = result.rows.map((r) => [
      r.created_at,
      r.feature,
      r.turn_number,
      r.total_tokens,
      r.cost_inr ?? '',
      maskEmail(r.email),
      (r.user_message || '').replace(/"/g, '""'),
      (r.claude_response || '').replace(/"/g, '""'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=query-logs.csv');
    res.send(csv);
  } catch (err) {
    console.error('admin logs export:', err);
    res.status(500).json({ error: 'Failed to export logs' });
  }
}
