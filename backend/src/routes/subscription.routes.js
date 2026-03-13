import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { query } from '../config/db.js';

const router = Router();
router.use(requireAuth);

router.get('/status', async (req, res) => {
  try {
    const result = await query(
      `SELECT plan FROM users WHERE id = $1`,
      [req.user.id]
    );
    const plan = result.rows[0]?.plan || 'free';
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TODO: Razorpay integration in Phase 2
router.post('/create-order', (req, res) => {
  res.status(501).json({ error: 'Subscription not yet implemented' });
});

router.post('/verify', (req, res) => {
  res.status(501).json({ error: 'Subscription not yet implemented' });
});

router.post('/cancel', (req, res) => {
  res.status(501).json({ error: 'Subscription not yet implemented' });
});

export default router;
