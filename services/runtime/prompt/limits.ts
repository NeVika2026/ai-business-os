export interface PromptLimits {
  maxPromptTokens: number;
  maxKnowledgeChunks: number;
  maxMemoryFacts: number;
  maxMemoryEntities: number;
  maxMemoryRelations: number;
  maxInjectedCharacters: number;
  maxMemoryItems: number;
  maxCRMItems: number;
}

export const DEFAULT_PROMPT_LIMITS: PromptLimits = {
  maxPromptTokens: 8000,
  maxKnowledgeChunks: 10,
  maxMemoryFacts: 20,
  maxMemoryEntities: 20,
  maxMemoryRelations: 20,
  maxInjectedCharacters: 12000,
  maxMemoryItems: 10,
  maxCRMItems: 10,
};

export function getPromptLimits(overrides?: Partial<PromptLimits>): PromptLimits {
  return {
    ...DEFAULT_PROMPT_LIMITS,
    ...overrides,
  };
}
