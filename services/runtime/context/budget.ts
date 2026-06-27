export interface ContextBudget {
  knowledgeChunks: number;
  memoryItems: number;
  crmItems: number;
}

export const DEFAULT_CONTEXT_BUDGET: ContextBudget = {
  knowledgeChunks: 8,
  memoryItems: 5,
  crmItems: 3,
};

export function getContextBudget(overrides?: Partial<ContextBudget>): ContextBudget {
  return {
    ...DEFAULT_CONTEXT_BUDGET,
    ...overrides,
  };
}
