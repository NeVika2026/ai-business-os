import type {
  InjectionBudgetLimits,
  InjectionBudgetSelectionResult,
  SerializedInjectionBudgetLimits,
  SerializedInjectionBudgetSelectionResult,
} from '@/services/runtime/context/injection-budget-selector-types';
import { DEFAULT_INJECTION_BUDGET_LIMITS } from '@/services/runtime/context/injection-budget-selector-types';

export function serializeInjectionBudgetLimits(
  limits: InjectionBudgetLimits,
): SerializedInjectionBudgetLimits {
  return {
    maxKnowledgeChunks: limits.maxKnowledgeChunks,
    maxMemoryFacts: limits.maxMemoryFacts,
    maxMemoryEntities: limits.maxMemoryEntities,
    maxMemoryRelations: limits.maxMemoryRelations,
    maxCharacters: limits.maxCharacters,
  };
}

export function serializeInjectionBudgetSelectionResult(
  result: InjectionBudgetSelectionResult<unknown>,
): SerializedInjectionBudgetSelectionResult {
  return {
    selectedCount:
      result.knowledge.length +
      result.facts.length +
      result.entities.length +
      result.relations.length,
    truncated: result.truncated,
    totalCharacters: result.totalCharacters,
  };
}

export function getDefaultInjectionBudgetLimits(): InjectionBudgetLimits {
  return { ...DEFAULT_INJECTION_BUDGET_LIMITS };
}

export { DEFAULT_INJECTION_BUDGET_LIMITS };
