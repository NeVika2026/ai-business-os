import { DEFAULT_INJECTION_BUDGET_LIMITS } from '@/services/runtime/context/injection-budget-selector-types';

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
  maxKnowledgeChunks: DEFAULT_INJECTION_BUDGET_LIMITS.maxKnowledgeChunks,
  maxMemoryFacts: DEFAULT_INJECTION_BUDGET_LIMITS.maxMemoryFacts,
  maxMemoryEntities: DEFAULT_INJECTION_BUDGET_LIMITS.maxMemoryEntities,
  maxMemoryRelations: DEFAULT_INJECTION_BUDGET_LIMITS.maxMemoryRelations,
  maxInjectedCharacters: DEFAULT_INJECTION_BUDGET_LIMITS.maxCharacters,
  maxMemoryItems: 10,
  maxCRMItems: 10,
};

export function getPromptLimits(overrides?: Partial<PromptLimits>): PromptLimits {
  return {
    ...DEFAULT_PROMPT_LIMITS,
    ...overrides,
  };
}
