import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createInjectionBudgetItem,
  dedupeInjectionItems,
  selectInjectionBudgetItems,
} from '@/services/runtime/context/injection-budget-selector';
import { InjectionBudgetSelectorValidationError } from '@/services/runtime/context/injection-budget-selector-errors';

describe('InjectionBudgetSelector', () => {
  it('deduplicates items by id with text fallback', () => {
    const items = [
      createInjectionBudgetItem({
        kind: 'fact',
        id: 'fact-1',
        fallbackKey: 'alpha',
        score: 1,
        characters: 5,
        value: 'alpha',
      }),
      createInjectionBudgetItem({
        kind: 'fact',
        id: 'fact-1',
        fallbackKey: 'alpha duplicate',
        score: 2,
        characters: 5,
        value: 'duplicate',
      }),
      createInjectionBudgetItem({
        kind: 'fact',
        id: null,
        fallbackKey: 'beta',
        score: 1,
        characters: 4,
        value: 'beta',
      }),
    ];

    const deduped = dedupeInjectionItems(items);
    assert.equal(deduped.length, 2);
    assert.equal(deduped[0]?.value, 'alpha');
    assert.equal(deduped[1]?.value, 'beta');
  });

  it('applies per-kind and character limits', () => {
    const items = Array.from({ length: 12 }, (_, index) =>
      createInjectionBudgetItem({
        kind: 'knowledge',
        id: `chunk-${index}`,
        fallbackKey: `content-${index}`,
        score: 12 - index,
        characters: 100,
        value: `content-${index}`,
      }),
    );

    const selected = selectInjectionBudgetItems(items, {
      maxKnowledgeChunks: 10,
      maxMemoryFacts: 20,
      maxMemoryEntities: 20,
      maxMemoryRelations: 20,
      maxCharacters: 12000,
    });

    assert.equal(selected.knowledge.length, 10);
    assert.equal(selected.truncated, true);
    assert.ok(selected.totalCharacters <= 12000);
  });

  it('never removes pinned memory facts', () => {
    const items = [
      createInjectionBudgetItem({
        kind: 'fact',
        id: 'pinned-1',
        fallbackKey: 'pinned fact',
        score: 0.1,
        characters: 50,
        pinned: true,
        value: 'pinned fact',
      }),
      ...Array.from({ length: 25 }, (_, index) =>
        createInjectionBudgetItem({
          kind: 'fact',
          id: `fact-${index}`,
          fallbackKey: `fact-${index}`,
          score: 1 + index,
          characters: 10,
          value: `fact-${index}`,
        }),
      ),
    ];

    const selected = selectInjectionBudgetItems(items, {
      maxKnowledgeChunks: 10,
      maxMemoryFacts: 20,
      maxMemoryEntities: 20,
      maxMemoryRelations: 20,
      maxCharacters: 12000,
    });

    assert.ok(selected.facts.includes('pinned fact'));
    assert.equal(selected.facts.length, 20);
  });

  it('rejects invalid character budget', () => {
    assert.throws(
      () =>
        selectInjectionBudgetItems([], {
          maxCharacters: 0,
        }),
      (error: unknown) => error instanceof InjectionBudgetSelectorValidationError,
    );
  });
});

describe('Runtime context injection integration', () => {
  it('returns empty selection for missing payload arrays without crashing', () => {
    const selected = selectInjectionBudgetItems([]);
    assert.deepEqual(selected.knowledge, []);
    assert.deepEqual(selected.facts, []);
    assert.equal(selected.truncated, false);
    assert.equal(selected.totalCharacters, 0);
  });
});
