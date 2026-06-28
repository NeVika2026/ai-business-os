import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { extractRuntimeOutputText, extractRuntimeTaskResult } from '@/utils/osa/runtime-output';

describe('OSA runtime output helpers', () => {
  it('extracts text from runtime output fields', () => {
    assert.equal(extractRuntimeOutputText({ content: 'Plan ready' }), 'Plan ready');
    assert.equal(extractRuntimeOutputText({ summary: 'Summary text' }), 'Summary text');
    assert.equal(extractRuntimeOutputText({ message: 'Done' }), 'Done');
    assert.equal(extractRuntimeOutputText(null), null);
  });

  it('builds task result with fallback text', () => {
    assert.deepEqual(extractRuntimeTaskResult({ content: 'Output' }), {
      summary: 'Output',
      output: 'Output',
    });

    assert.deepEqual(extractRuntimeTaskResult(undefined), {
      summary: 'Task completed via RuntimeBridge',
      output: 'Task completed via RuntimeBridge',
    });
  });
});
