import { query } from '../config/db.js';

export async function status(req, res) {
  try {
    let dbLatency = null;
    let dbStatus = 'unknown';
    try {
      const t0 = Date.now();
      await query('SELECT 1');
      dbLatency = Date.now() - t0;
      dbStatus = 'online';
    } catch {
      dbStatus = 'error';
    }

    const recentErrors = await query(
      `SELECT id, created_at, feature, error
       FROM query_logs
       WHERE error IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 10`
    ).catch(() => ({ rows: [] }));

    res.json({
      services: [
        { name: 'Node.js API', status: 'online', latency_p50_ms: null, error_rate_1h: null },
        { name: 'NeonDB', status: dbStatus, latency_p50_ms: dbLatency, error_rate_1h: null },
      ],
      recent_errors: recentErrors.rows?.map((r) => ({
        time: r.created_at,
        service: r.feature || 'claude',
        message: r.error,
        log_id: r.id,
      })) || [],
    });
  } catch (err) {
    console.error('admin health:', err);
    res.status(500).json({ error: 'Failed to fetch health status' });
  }
}
