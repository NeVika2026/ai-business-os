import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  mapCaughtErrorToUserMessage,
  USER_FACING_GATEWAY_ERROR,
  USER_FACING_MEMORY_ERROR,
  USER_FACING_RUNTIME_ERROR,
  userFacingErrorMessage,
} from '@/lib/ai/user-facing-errors';

describe('user-facing errors', () => {
  it('returns stable messages per error kind', () => {
    assert.match(userFacingErrorMessage('gateway'), /AI/);
    assert.match(userFacingErrorMessage('runtime'), /недоступен|Runtime/i);
    assert.match(userFacingErrorMessage('memory'), /Memory/i);
    assert.match(userFacingErrorMessage('generic'), /пошло не так/i);
  });

  it('maps gateway failures from caught errors', () => {
    assert.equal(
      mapCaughtErrorToUserMessage(new Error('Gateway timeout while calling provider')),
      USER_FACING_GATEWAY_ERROR,
    );
  });

  it('maps runtime failures from caught errors', () => {
    assert.equal(
      mapCaughtErrorToUserMessage(new Error('Project runtime unavailable')),
      USER_FACING_RUNTIME_ERROR,
    );
  });

  it('maps memory failures from caught errors', () => {
    assert.equal(
      mapCaughtErrorToUserMessage(new Error('memory store read failed')),
      USER_FACING_MEMORY_ERROR,
    );
  });
});
