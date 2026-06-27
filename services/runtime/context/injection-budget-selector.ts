import { InjectionBudgetSelectorValidationError } from '@/services/runtime/context/injection-budget-selector-errors';
import type {
  InjectionBudgetItem,
  InjectionBudgetKind,
  InjectionBudgetLimits,
  InjectionBudgetSelectionResult,
} from '@/services/runtime/context/injection-budget-selector-types';
import {
  DEFAULT_INJECTION_BUDGET_LIMITS,
  getDefaultInjectionBudgetLimits,
} from '@/services/runtime/context/injection-budget-selector-serializer';

function maxForKind(limits: InjectionBudgetLimits, kind: InjectionBudgetKind): number {
  switch (kind) {
    case 'knowledge':
      return limits.maxKnowledgeChunks;
    case 'fact':
      return limits.maxMemoryFacts;
    case 'entity':
      return limits.maxMemoryEntities;
    case 'relation':
      return limits.maxMemoryRelations;
    default:
      return 0;
  }
}

function emptySelection(): InjectionBudgetSelectionResult<unknown> {
  return {
    knowledge: [],
    facts: [],
    entities: [],
    relations: [],
    truncated: false,
    totalCharacters: 0,
  };
}

export function dedupeInjectionItems<T>(items: InjectionBudgetItem<T>[]): InjectionBudgetItem<T>[] {
  const seen = new Set<string>();
  const result: InjectionBudgetItem<T>[] = [];

  for (const item of items) {
    const key = item.id ?? item.fallbackKey;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

export function selectInjectionBudgetItems(
  items: InjectionBudgetItem<unknown>[],
  limits: Partial<InjectionBudgetLimits> = {},
): InjectionBudgetSelectionResult<unknown> {
  const resolvedLimits = {
    ...getDefaultInjectionBudgetLimits(),
    ...limits,
  };

  if (resolvedLimits.maxCharacters <= 0) {
    throw new InjectionBudgetSelectorValidationError('maxCharacters must be greater than zero');
  }

  const deduped = dedupeInjectionItems(items);
  if (deduped.length === 0) {
    return emptySelection();
  }

  const pinned = deduped.filter((item) => item.pinned);
  const unpinned = deduped
    .filter((item) => !item.pinned)
    .sort((left, right) => right.score - left.score);

  const knowledge: unknown[] = [];
  const facts: unknown[] = [];
  const entities: unknown[] = [];
  const relations: unknown[] = [];
  const counts: Record<InjectionBudgetKind, number> = {
    knowledge: 0,
    fact: 0,
    entity: 0,
    relation: 0,
  };
  let totalCharacters = 0;
  let truncated = deduped.length < items.length;

  const pushValue = (item: InjectionBudgetItem<unknown>): void => {
    switch (item.kind) {
      case 'knowledge':
        knowledge.push(item.value);
        break;
      case 'fact':
        facts.push(item.value);
        break;
      case 'entity':
        entities.push(item.value);
        break;
      case 'relation':
        relations.push(item.value);
        break;
      default:
        break;
    }
  };

  const tryAdd = (item: InjectionBudgetItem<unknown>, forcePinned: boolean): boolean => {
    const maxCount = maxForKind(resolvedLimits, item.kind);
    if (!forcePinned && counts[item.kind] >= maxCount) {
      truncated = true;
      return false;
    }

    if (totalCharacters + item.characters > resolvedLimits.maxCharacters && totalCharacters > 0) {
      truncated = true;
      return false;
    }

    if (item.characters > resolvedLimits.maxCharacters) {
      truncated = true;
      return false;
    }

    pushValue(item);
    counts[item.kind] += 1;
    totalCharacters += item.characters;
    return true;
  };

  for (const item of pinned) {
    tryAdd(item, true);
  }

  for (const item of unpinned) {
    tryAdd(item, false);
  }

  if (
    deduped.filter((item) => !item.pinned).length >
    knowledge.length + facts.length + entities.length + relations.length - pinned.length
  ) {
    truncated = true;
  }

  return {
    knowledge,
    facts,
    entities,
    relations,
    truncated,
    totalCharacters,
  };
}

export function createInjectionBudgetItem<T>(input: {
  kind: InjectionBudgetKind;
  id: string | null;
  fallbackKey: string;
  score: number;
  characters: number;
  pinned?: boolean;
  value: T;
}): InjectionBudgetItem<T> {
  if (!input.fallbackKey.trim()) {
    throw new InjectionBudgetSelectorValidationError('fallbackKey is required');
  }

  return {
    kind: input.kind,
    id: input.id,
    fallbackKey: input.fallbackKey.trim(),
    score: input.score,
    characters: input.characters,
    pinned: input.pinned ?? false,
    value: input.value,
  };
}

export { DEFAULT_INJECTION_BUDGET_LIMITS, getDefaultInjectionBudgetLimits };
