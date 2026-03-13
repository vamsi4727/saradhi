import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { query } from '../config/db.js';
import { fetchStock } from '../services/pythonBridge.js';
import { getActivePrompt } from '../services/promptService.js';
import { callClaude } from '../services/claudeService.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM recommendations 
       WHERE user_id = $1 AND is_active = TRUE 
       ORDER BY composite_score DESC 
       LIMIT 5`,
      [req.user.id]
    );

    if (result.rows.length > 0) {
      return res.json({ recommendations: result.rows });
    }

    // Generate recommendations if none exist
    const profileResult = await query(
      `SELECT * FROM risk_profiles WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [req.user.id]
    );
    const profile = profileResult.rows[0];
    const risk = profile?.risk_tolerance || 'moderate';

    const STOCK_UNIVERSE = {
      conservative: ['HDFCBANK.NS', 'INFY.NS', 'TCS.NS', 'NESTLEIND.NS'],
      moderate: ['TATAMOTORS.NS', 'AXISBANK.NS', 'SUNPHARMA.NS', 'MARUTI.NS'],
      aggressive: ['ADANIENT.NS', 'ZOMATO.NS', 'IRCTC.NS', 'NYKAA.NS'],
    };
    const symbols = STOCK_UNIVERSE[risk] || STOCK_UNIVERSE.moderate;

    const recommendations = [];
    for (let i = 0; i < Math.min(3, symbols.length); i++) {
      try {
        const data = await fetchStock(symbols[i]);
        const prompt = await getActivePrompt('recommendation_rationale');
        const rationale =
          prompt?.system_prompt
            ? await callClaude({
                userId: req.user.id,
                sessionId: null,
                turnNumber: 1,
                feature: 'recommendation',
                promptKey: 'recommendation_rationale',
                promptVersion: prompt?.version || 1,
                systemPrompt: prompt.system_prompt,
                messages: [
                  {
                    role: 'user',
                    content: `User: ${JSON.stringify(profile || {})}. Asset: ${JSON.stringify(data)}`,
                  },
                ],
                injectedContext: {
                  user_profile: profile,
                  asset_data_json: JSON.stringify(data),
                },
              })
            : `Recommended for your goals. | AI insight, not financial advice.`;

        const rec = await query(
          `INSERT INTO recommendations (user_id, asset_type, symbol, name, rationale, sentiment_score, fundamental_score, composite_score, price, change_pct, sparkline_data)
           VALUES ($1, 'stock', $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            req.user.id,
            data.symbol,
            data.name || data.symbol,
            rationale,
            data.sentiment_score ?? 0.5,
            data.pe_ratio ? 1 / Math.min(data.pe_ratio / 30, 1) : 0.5,
            0.7,
            data.price,
            data.change_pct ?? 0,
            JSON.stringify(data.sparkline || []),
          ]
        );
        recommendations.push(rec.rows[0]);
      } catch (err) {
        console.error('Recommendation fetch error:', err);
      }
    }

    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM recommendations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
