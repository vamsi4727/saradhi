import Anthropic from '@anthropic-ai/sdk';
import { query } from '../config/db.js';
import { calculateCost } from '../../shared/claudePricing.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

export async function callClaude({
  userId,
  sessionId,
  turnNumber,
  feature,
  promptKey,
  promptVersion,
  systemPrompt,
  messages,
  injectedContext = {},
}) {
  const t0 = Date.now();
  let claudeResponse = null;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    claudeResponse = response.content[0].text;
    const tokens = response.usage;
    const costs = calculateCost(tokens.input_tokens, tokens.output_tokens);
    const latencyMs = Date.now() - t0;

    // Fire-and-forget logging
    query(
      `INSERT INTO query_logs (
        user_id, session_id, feature, turn_number,
        user_message, system_prompt_key, prompt_version, injected_context,
        claude_response, input_tokens, output_tokens, total_tokens, model,
        input_cost_usd, output_cost_usd, total_cost_usd, cost_inr,
        latency_ms, flags
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        userId,
        sessionId,
        feature,
        turnNumber,
        messages.at(-1)?.content || '',
        promptKey,
        promptVersion || 1,
        JSON.stringify(injectedContext),
        claudeResponse,
        tokens.input_tokens,
        tokens.output_tokens,
        tokens.input_tokens + tokens.output_tokens,
        model,
        costs.inputCost,
        costs.outputCost,
        costs.totalUsd,
        costs.totalInr,
        latencyMs,
        [],
      ]
    ).catch(console.error);

    // Update session totals
    query(
      `SELECT increment_session_totals($1,$2,$3,$4,$5)`,
      [sessionId, tokens.input_tokens, tokens.output_tokens, costs.totalInr, latencyMs]
    ).catch(console.error);

    return claudeResponse;
  } catch (err) {
    query(
      `INSERT INTO query_logs (user_id, session_id, feature, error, latency_ms)
       VALUES ($1,$2,$3,$4,$5)`,
      [userId, sessionId, feature, err.message, Date.now() - t0]
    ).catch(console.error);
    throw err;
  }
}
