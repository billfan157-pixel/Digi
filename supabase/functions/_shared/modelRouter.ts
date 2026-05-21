export type AiAction = 'advice' | 'chat' | 'report-analysis' | 'agentic';

export type ModelTier = 'fast' | 'smart';

export const MODELS: Record<ModelTier, string> = {
  fast: 'llama-3.1-8b-instant',
  smart: 'llama-3.3-70b-versatile',
};

const ACTION_TIER: Record<AiAction, ModelTier> = {
  advice: 'fast',
  chat: 'fast',
  'report-analysis': 'smart',
  agentic: 'smart',
};

const MAX_TOKENS_MAP: Record<AiAction, number> = {
  advice: 120,
  chat: 250,
  'report-analysis': 500,
  agentic: 350,
};

/**
 * Returns the correct Groq model identifier for the given action.
 */
export function getModelForAction(action: AiAction): string {
  const tier = ACTION_TIER[action] || 'fast';
  return MODELS[tier];
}

/**
 * Returns the maximum output token limit configured for the action.
 */
export function getMaxTokensForAction(action: AiAction): number {
  return MAX_TOKENS_MAP[action] || 150;
}
