import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { HOME_VOICE_WELCOME_TEXT } from '@/utils/voice/voice-welcome';
import { VOICE_WELCOME_TEXT } from '@/utils/home/voice-welcome';

describe('welcome copy', () => {
  it('keeps home welcome copy available without speech API', () => {
    assert.match(HOME_VOICE_WELCOME_TEXT, /Привет, друг/);
    assert.match(VOICE_WELCOME_TEXT, /результат хочешь получить/);
  });
});
