import { query } from '../config/db.js';

const FREE_LIMITS = {
  copilot_query: 5,
  recommendation_refresh: 1,
};

export const checkFreemiumLimit = (feature) => async (req, res, next) => {
  if (req.user?.plan === 'pro') return next();

  const today = new Date().toISOString().split('T')[0];
  const result = await query(
    `SELECT COUNT(*) FROM usage_tracking
     WHERE user_id = $1 AND feature = $2 AND date = $3`,
    [req.user.id, feature, today]
  );

  const count = parseInt(result.rows[0].count, 10);
  const limit = FREE_LIMITS[feature] ?? 5;

  if (count >= limit) {
    return res.status(429).json({
      error: `Daily limit reached — ${limit} ${feature.replace('_', ' ')}s for free users`,
      used: count,
      limit,
      upgrade_url: '/subscription',
    });
  }

  await query(
    `INSERT INTO usage_tracking (user_id, feature) VALUES ($1, $2)`,
    [req.user.id, feature]
  );

  next();
};
