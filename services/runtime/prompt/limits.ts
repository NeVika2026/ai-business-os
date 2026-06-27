export interface PromptLimits {
  maxPromptTokens: number;
  maxKnowledgeChunks: number;
  maxMemoryItems: number;
  maxCRMItems: number;
}

export const DEFAULT_PROMPT_LIMITS: PromptLimits = {
  maxPromptTokens: 8000,
  maxKnowledgeChunks: 20,
  maxMemoryItems: 10,
  maxCRMItems: 10,
};

export function getPromptLimits(overrides?: Partial<PromptLimits>): PromptLimits {
  return {
    ...DEFAULT_PROMPT_LIMITS,
    ...overrides,
  };
}
