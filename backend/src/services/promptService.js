import { query } from '../config/db.js';

const promptCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getActivePrompt(promptKey) {
  const cached = promptCache.get(promptKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.prompt;
  }

  const result = await query(
    `SELECT system_prompt, user_prompt_template, variables, version
     FROM prompt_templates
     WHERE prompt_key = $1 AND is_active = TRUE
     LIMIT 1`,
    [promptKey]
  );

  const prompt = result.rows[0];
  if (prompt) {
    promptCache.set(promptKey, { prompt, fetchedAt: Date.now() });
  }
  return prompt;
}

export function clearPromptCache(promptKey) {
  if (promptKey) {
    promptCache.delete(promptKey);
  } else {
    promptCache.clear();
  }
}
