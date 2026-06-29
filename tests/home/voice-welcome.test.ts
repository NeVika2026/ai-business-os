import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isSpeechSynthesisSupported,
  VOICE_WELCOME_BUTTON_LABEL,
  VOICE_WELCOME_TEXT,
} from '@/utils/home/voice-welcome';

describe('voice welcome', () => {
  it('exposes the welcome copy and button label', () => {
    assert.match(VOICE_WELCOME_TEXT, /Привет, друг/);
    assert.match(VOICE_WELCOME_TEXT, /результат хочешь получить/);
    assert.equal(VOICE_WELCOME_BUTTON_LABEL, 'Включить приветствие');
  });

  it('reports speech synthesis as unavailable without window', () => {
    assert.equal(isSpeechSynthesisSupported(), false);
  });
});
