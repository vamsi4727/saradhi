/**
 * Claude API pricing calculator
 * Used for cost tracking in query_logs and admin analytics
 */

export const CLAUDE_PRICING = {
  'claude-sonnet-4-6': {
    input_per_million: 3.0,
    output_per_million: 15.0,
  },
};

export const USD_TO_INR = 83.5;

export function calculateCost(inputTokens, outputTokens, model = 'claude-sonnet-4-6') {
  const p = CLAUDE_PRICING[model] || CLAUDE_PRICING['claude-sonnet-4-6'];
  const inputCost = (inputTokens / 1_000_000) * p.input_per_million;
  const outputCost = (outputTokens / 1_000_000) * p.output_per_million;
  const totalUsd = inputCost + outputCost;
  return {
    inputCost,
    outputCost,
    totalUsd,
    totalInr: parseFloat((totalUsd * USD_TO_INR).toFixed(4)),
  };
}
