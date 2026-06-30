import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { VOICE_WELCOME_TEXT } from '@/utils/home/voice-welcome';

describe('home voice welcome shim', () => {
  it('re-exports home copy for backward compatibility', () => {
    assert.match(VOICE_WELCOME_TEXT, /Привет, друг/);
  });
});
