import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  parseAnthropicSseLine,
  parseNdjsonLine,
  parseOpenAiSseLine,
} from '@/services/runtime/gateway/sse-stream';

describe('SSE stream parsers', () => {
  it('parses OpenAI SSE data lines', () => {
    const chunk = parseOpenAiSseLine('data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}');
    assert.ok(chunk);
    assert.equal(chunk?.contentDelta, 'Hello');
    assert.equal(chunk?.done, false);

    const done = parseOpenAiSseLine('data: [DONE]');
    assert.equal(done?.done, true);
  });

  it('parses Anthropic SSE data lines', () => {
    const chunk = parseAnthropicSseLine('data: {"type":"content_block_delta","delta":{"text":"Hi"}}');
    assert.ok(chunk);
    assert.equal(chunk?.contentDelta, 'Hi');
  });

  it('parses NDJSON lines for Ollama', () => {
    const chunk = parseNdjsonLine('{"message":{"content":"chunk"},"done":false}');
    assert.ok(chunk);
    assert.equal(chunk?.contentDelta, 'chunk');
  });
});
