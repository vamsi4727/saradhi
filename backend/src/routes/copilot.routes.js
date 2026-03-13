import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { checkFreemiumLimit } from '../middleware/freemium.middleware.js';
import { getActivePrompt } from '../services/promptService.js';
import { callClaude } from '../services/claudeService.js';
import { query } from '../config/db.js';
import { fetchStock, fetchSentiment } from '../services/pythonBridge.js';

const router = Router();
router.use(requireAuth);

router.post('/query', checkFreemiumLimit('copilot_query'), async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let sessionId = session_id;
    if (!sessionId) {
      const insertResult = await query(
        `INSERT INTO conversation_sessions (user_id, feature) VALUES ($1, 'copilot') RETURNING id`,
        [req.user.id]
      );
      sessionId = insertResult.rows[0].id;
    }

    const profileResult = await query(
      `SELECT * FROM risk_profiles WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [req.user.id]
    );
    const profile = profileResult.rows[0];

    let marketData = {};
    try {
      const sentiment = await fetchSentiment(message);
      marketData.sentiment = sentiment;
    } catch (_) {}

    const prompt = await getActivePrompt('copilot_system');
    const systemPrompt =
      prompt?.system_prompt ||
      `You are Saaradhi, an AI financial co-pilot for Indian investors. Use simple English. Ground answers in real data. End with: ⚠️ AI-generated research for educational purposes. Not SEBI-registered financial advice.`;

    const reply = await callClaude({
      userId: req.user.id,
      sessionId,
      turnNumber: 1,
      feature: 'copilot',
      promptKey: 'copilot_system',
      promptVersion: prompt?.version || 1,
      systemPrompt,
      messages: [{ role: 'user', content: message }],
      injectedContext: {
        goal: profile?.goal,
        risk_tolerance: profile?.risk_tolerance,
        time_horizon_years: profile?.time_horizon_years,
        market_data_json: JSON.stringify(marketData),
      },
    });

    res.json({ reply, session_id: sessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/usage', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(
      `SELECT COUNT(*) FROM usage_tracking WHERE user_id = $1 AND feature = 'copilot_query' AND date = $2`,
      [req.user.id, today]
    );
    const used = parseInt(result.rows[0].count, 10);
    const limit = req.user.plan === 'pro' ? 999 : 5;
    res.json({ used, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
