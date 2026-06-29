import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FIND_CLIENTS_PROJECT,
  resolveGoalProjectName,
} from '@/utils/projects/goal-project';

describe('goal project', () => {
  it('maps find_clients to Client Growth', () => {
    assert.equal(resolveGoalProjectName('find_clients'), FIND_CLIENTS_PROJECT.name);
    assert.equal(resolveGoalProjectName('increase_revenue'), null);
  });
});
