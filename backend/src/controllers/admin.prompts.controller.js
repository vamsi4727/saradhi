import Anthropic from '@anthropic-ai/sdk';
import { query } from '../config/db.js';
import { getActivePrompt, clearPromptCache } from '../services/promptService.js';
import { calculateCost } from '../../shared/claudePricing.js';
import rateLimit from 'express-rate-limit';

const testLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

export async function list(req, res) {
  try {
    const result = await query(
      `SELECT prompt_key, MAX(version) as max_version,
        (SELECT version FROM prompt_templates pt2
         WHERE pt2.prompt_key = pt.prompt_key AND pt2.is_active = TRUE LIMIT 1) as active_version
       FROM prompt_templates pt
       GROUP BY prompt_key`
    );

    const prompts = result.rows.map((r) => ({
      key: r.prompt_key,
      max_version: parseInt(r.max_version, 10),
      active_version: r.active_version ? parseInt(r.active_version, 10) : null,
    }));

    res.json({ prompts });
  } catch (err) {
    console.error('admin prompts list:', err);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
}

export async function getVersions(req, res) {
  try {
    const { key } = req.params;
    const result = await query(
      `SELECT id, version, system_prompt, user_prompt_template, variables,
        is_active, is_draft, change_notes, published_at, created_at
       FROM prompt_templates
       WHERE prompt_key = $1
       ORDER BY version DESC`,
      [key]
    );

    res.json({ versions: result.rows });
  } catch (err) {
    console.error('admin prompts getVersions:', err);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
}

export async function getActive(req, res) {
  try {
    const { key } = req.params;
    const prompt = await getActivePrompt(key);
    if (!prompt) return res.status(404).json({ error: 'No active prompt found' });
    res.json(prompt);
  } catch (err) {
    console.error('admin prompts getActive:', err);
    res.status(500).json({ error: 'Failed to fetch active prompt' });
  }
}

export async function saveDraft(req, res) {
  try {
    const { key } = req.params;
    const { system_prompt, user_prompt_template, variables, change_notes } = req.body;

    const maxResult = await query(
      `SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM prompt_templates WHERE prompt_key = $1`,
      [key]
    );
    const nextVersion = maxResult.rows[0]?.next_version ?? 1;

    await query(
      `INSERT INTO prompt_templates (prompt_key, version, system_prompt, user_prompt_template, variables, is_active, is_draft, change_notes)
       VALUES ($1, $2, $3, $4, $5, FALSE, TRUE, $6)`,
      [
        key,
        nextVersion,
        system_prompt || '',
        user_prompt_template || null,
        variables ? JSON.stringify(variables) : null,
        change_notes || null,
      ]
    );

    res.json({ success: true, version: nextVersion });
  } catch (err) {
    console.error('admin prompts saveDraft:', err);
    res.status(500).json({ error: 'Failed to save draft' });
  }
}

export async function publish(req, res) {
  try {
    const { key } = req.params;
    const { version } = req.body;

    await query(
      `UPDATE prompt_templates SET is_active = FALSE WHERE prompt_key = $1`,
      [key]
    );
    await query(
      `UPDATE prompt_templates SET is_active = TRUE, is_draft = FALSE, published_at = NOW()
       WHERE prompt_key = $1 AND version = $2`,
      [key, version]
    );

    clearPromptCache(key);
    res.json({ success: true });
  } catch (err) {
    console.error('admin prompts publish:', err);
    res.status(500).json({ error: 'Failed to publish' });
  }
}

export async function rollback(req, res) {
  try {
    const { key, v } = req.params;
    await query(
      `UPDATE prompt_templates SET is_active = FALSE WHERE prompt_key = $1`,
      [key]
    );
    await query(
      `UPDATE prompt_templates SET is_active = TRUE, is_draft = FALSE
       WHERE prompt_key = $1 AND version = $2`,
      [key, v]
    );

    clearPromptCache(key);
    res.json({ success: true });
  } catch (err) {
    console.error('admin prompts rollback:', err);
    res.status(500).json({ error: 'Failed to rollback' });
  }
}

export async function test(req, res, next) {
  testLimiter(req, res, async () => {
    try {
      const { system_prompt, user_message } = req.body;
      if (!system_prompt || !user_message) {
        return res.status(400).json({ error: 'system_prompt and user_message required' });
      }

      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: system_prompt,
        messages: [{ role: 'user', content: user_message }],
      });

      const text = response.content[0]?.text || '';
      const usage = response.usage;
      const costs = calculateCost(usage.input_tokens, usage.output_tokens);

      res.json({
        response: text,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        total_tokens: usage.input_tokens + usage.output_tokens,
        cost_inr: costs.totalInr,
      });
    } catch (err) {
      console.error('admin prompts test:', err);
      res.status(500).json({ error: err.message || 'Test failed' });
    }
  });
}
