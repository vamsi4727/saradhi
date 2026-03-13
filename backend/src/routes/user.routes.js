import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { query } from '../config/db.js';

const router = Router();
router.use(requireAuth);

router.get('/profile', async (req, res) => {
  try {
    const userResult = await query(
      `SELECT id, email, name, avatar_url, plan FROM users WHERE id = $1`,
      [req.user.id]
    );
    const profileResult = await query(
      `SELECT * FROM risk_profiles WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [req.user.id]
    );

    res.json({
      user: userResult.rows[0],
      risk_profile: profileResult.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/profile', async (req, res) => {
  try {
    const { goal, goal_amount, time_horizon_years, risk_tolerance, monthly_investment, existing_investments } =
      req.body;

    await query(
      `INSERT INTO risk_profiles (user_id, goal, goal_amount, time_horizon_years, risk_tolerance, monthly_investment, existing_investments, completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
      [
        req.user.id,
        goal || '',
        goal_amount || null,
        time_horizon_years || null,
        risk_tolerance || 'moderate',
        monthly_investment || null,
        existing_investments || null,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { goal, goal_amount, time_horizon_years, risk_tolerance, monthly_investment, existing_investments } =
      req.body;

    await query(
      `UPDATE risk_profiles SET
        goal = COALESCE($2, goal),
        goal_amount = COALESCE($3, goal_amount),
        time_horizon_years = COALESCE($4, time_horizon_years),
        risk_tolerance = COALESCE($5, risk_tolerance),
        monthly_investment = COALESCE($6, monthly_investment),
        existing_investments = COALESCE($7, existing_investments),
        updated_at = NOW()
       WHERE user_id = $1`,
      [
        req.user.id,
        goal,
        goal_amount,
        time_horizon_years,
        risk_tolerance,
        monthly_investment,
        existing_investments,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
