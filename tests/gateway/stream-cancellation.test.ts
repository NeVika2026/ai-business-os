import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  cancelStream,
  clearStreamCancellation,
  registerStreamCancellation,
  resetStreamCancellations,
} from '@/services/runtime/gateway/stream-cancellation';

describe('Stream cancellation registry', () => {
  it('registers and cancels active streams', () => {
    resetStreamCancellations();
    const signal = registerStreamCancellation('run-cancel-test');
    assert.equal(signal.aborted, false);
    assert.equal(cancelStream('run-cancel-test'), true);
    assert.equal(cancelStream('missing-run'), false);
    clearStreamCancellation('run-cancel-test');
  });
});
