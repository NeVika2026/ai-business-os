export const DEFAULT_INJECTION_BUDGET_LIMITS = {
  maxKnowledgeChunks: 10,
  maxMemoryFacts: 20,
  maxMemoryEntities: 20,
  maxMemoryRelations: 20,
  maxCharacters: 12000,
} as const;

export type InjectionBudgetKind = 'knowledge' | 'fact' | 'entity' | 'relation';

export interface InjectionBudgetLimits {
  maxKnowledgeChunks: number;
  maxMemoryFacts: number;
  maxMemoryEntities: number;
  maxMemoryRelations: number;
  maxCharacters: number;
}

export interface InjectionBudgetItem<T> {
  kind: InjectionBudgetKind;
  id: string | null;
  fallbackKey: string;
  score: number;
  characters: number;
  pinned: boolean;
  value: T;
}

export interface InjectionBudgetSelectionResult<T> {
  knowledge: T[];
  facts: T[];
  entities: T[];
  relations: T[];
  truncated: boolean;
  totalCharacters: number;
}

export interface SerializedInjectionBudgetLimits {
  maxKnowledgeChunks: number;
  maxMemoryFacts: number;
  maxMemoryEntities: number;
  maxMemoryRelations: number;
  maxCharacters: number;
}

export interface SerializedInjectionBudgetSelectionResult {
  selectedCount: number;
  truncated: boolean;
  totalCharacters: number;
}
