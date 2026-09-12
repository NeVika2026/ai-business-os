import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  appendSpeechTranscript,
  canUseSpeechRecognition,
  normalizeSpeechTranscript,
} from '@/utils/platform/voice-input';

describe('Business Zavod voice input helpers', () => {
  it('normalizes whitespace in speech transcripts', () => {
    assert.equal(normalizeSpeechTranscript('  Сделай   ролик\nпро страховку  '), 'Сделай ролик про страховку');
  });

  it('appends dictated text without damaging the typed request', () => {
    assert.equal(
      appendSpeechTranscript('Сделай ролик', 'про страхование квартиры'),
      'Сделай ролик про страхование квартиры',
    );
    assert.equal(appendSpeechTranscript('', 'Найди клиентов'), 'Найди клиентов');
  });

  it('detects both browser speech recognition implementations', () => {
    assert.equal(canUseSpeechRecognition({ SpeechRecognition: function SpeechRecognition() {} }), true);
    assert.equal(
      canUseSpeechRecognition({ webkitSpeechRecognition: function WebkitSpeechRecognition() {} }),
      true,
    );
    assert.equal(canUseSpeechRecognition({}), false);
  });
});
