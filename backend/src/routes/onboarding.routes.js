import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getActivePrompt } from '../services/promptService.js';
import { callClaude } from '../services/claudeService.js';
import { query } from '../config/db.js';
import { randomUUID } from 'crypto';

const router = Router();
router.use(requireAuth);

router.post('/chat', async (req, res) => {
  try {
    const { message, session_id, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let sessionId = session_id;
    if (!sessionId) {
      const insertResult = await query(
        `INSERT INTO conversation_sessions (user_id, feature) VALUES ($1, 'onboarding') RETURNING id`,
        [req.user.id]
      );
      sessionId = insertResult.rows[0].id;
    }

    const prompt = await getActivePrompt('onboarding_system');
    const systemPrompt = prompt?.system_prompt || `You are Saaradhi, a warm Indian financial co-pilot. 
Extract investment goals through friendly conversation. 
Respond in simple English. Ask ONE follow-up at a time.
When you have enough info, output <PROFILE_EXTRACTED>{...}</PROFILE_EXTRACTED>`;

    const messages = [
      ...history.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || m.message,
      })),
      { role: 'user', content: message },
    ];

    const reply = await callClaude({
      userId: req.user.id,
      sessionId,
      turnNumber: messages.length,
      feature: 'onboarding',
      promptKey: 'onboarding_system',
      promptVersion: prompt?.version || 1,
      systemPrompt,
      messages,
      injectedContext: { history: JSON.stringify(history), user_message: message },
    });

    let extracted_profile = null;
    const profileMatch = reply.match(/<PROFILE_EXTRACTED>([\s\S]*?)<\/PROFILE_EXTRACTED>/);
    if (profileMatch) {
      try {
        extracted_profile = JSON.parse(profileMatch[1].trim());
      } catch (_) {}
    }

    const is_complete = !!extracted_profile;

    res.json({
      reply,
      extracted_profile,
      is_complete,
      session_id: sessionId,
    });
  } catch (err) {
    console.error('Onboarding chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
