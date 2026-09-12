import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MARKETING_CHANNELS,
  buildMarketingPackPrompt,
} from '@/utils/platform/marketing-pack';

describe('Business Zavod marketing pack', () => {
  it('keeps the useful structure from the marketing-ai prototype', () => {
    const prompt = buildMarketingPackPrompt({
      product: 'Страхование ипотечной квартиры',
      audience: 'Собственники квартир с ипотекой',
      channels: ['VK', 'Telegram'],
    });

    assert.match(prompt, /оффер/i);
    assert.match(prompt, /5 сегмент/i);
    assert.match(prompt, /7 дней/i);
    assert.match(prompt, /10 идей/i);
    assert.match(prompt, /объявлен/i);
    assert.match(prompt, /скрипт/i);
    assert.match(prompt, /конкурент/i);
    assert.match(prompt, /VK, Telegram/);
  });

  it('exposes common marketing channels without provider names', () => {
    assert.ok(MARKETING_CHANNELS.includes('VK'));
    assert.ok(MARKETING_CHANNELS.includes('Telegram'));
    assert.ok(MARKETING_CHANNELS.includes('YouTube'));
    assert.doesNotMatch(MARKETING_CHANNELS.join(' '), /OpenAI|Runway|ElevenLabs/i);
  });
});
