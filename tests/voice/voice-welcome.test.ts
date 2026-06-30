import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HOME_VOICE_WELCOME_TEXT,
  isSpeechSynthesisSupported,
  LOGIN_VOICE_WELCOME_TEXT,
  VOICE_WELCOME_BUTTON_LABEL,
  VOICE_WELCOME_STOP_LABEL,
} from '@/utils/voice/voice-welcome';

describe('voice welcome', () => {
  it('exposes shared button labels in Russian', () => {
    assert.equal(VOICE_WELCOME_BUTTON_LABEL, 'Включить приветствие');
    assert.equal(VOICE_WELCOME_STOP_LABEL, 'Остановить');
  });

  it('exposes home welcome copy', () => {
    assert.match(HOME_VOICE_WELCOME_TEXT, /Привет, друг/);
    assert.match(HOME_VOICE_WELCOME_TEXT, /результат хочешь получить/);
  });

  it('exposes login welcome copy', () => {
    assert.match(LOGIN_VOICE_WELCOME_TEXT, /Привет\./);
    assert.match(LOGIN_VOICE_WELCOME_TEXT, /первый черновик/);
    assert.match(LOGIN_VOICE_WELCOME_TEXT, /Регистрация понадобится только потом/);
  });

  it('reports speech synthesis as unavailable without window', () => {
    assert.equal(isSpeechSynthesisSupported(), false);
  });
});
