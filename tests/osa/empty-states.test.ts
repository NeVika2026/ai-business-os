import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OSA_EMPTY_STATES } from '@/utils/osa/empty-states';
import { OSA_LOADING_MESSAGES } from '@/utils/osa/loading-messages';

describe('osa empty and loading copy', () => {
  it('defines empty states for all primary surfaces', () => {
    for (const key of [
      'workspace',
      'replay',
      'executiveMemory',
      'deliverables',
      'results',
      'orchestra',
      'homeActivity',
    ] as const) {
      const state = OSA_EMPTY_STATES[key];
      assert.ok(state.title.length > 0);
      assert.ok(state.description.length > 0);
      assert.ok(state.hint.length > 0);
    }
  });

  it('defines descriptive loading messages', () => {
    for (const message of Object.values(OSA_LOADING_MESSAGES)) {
      assert.ok(message.endsWith('…'));
      assert.ok(message.length > 10);
    }
  });
});
