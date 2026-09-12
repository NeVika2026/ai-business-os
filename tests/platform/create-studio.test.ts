import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CREATE_STUDIO_MODES,
  buildCreateStudioPrompt,
} from '@/utils/platform/create-studio';

describe('Business Zavod Create Studio', () => {
  it('exposes six provider-neutral creation modes', () => {
    assert.deepEqual(
      CREATE_STUDIO_MODES.map((item) => item.label),
      ['Видео', 'Картинка', 'Сторис', 'Презентация', 'Документ', 'Озвучка'],
    );

    assert.doesNotMatch(
      JSON.stringify(CREATE_STUDIO_MODES),
      /OpenAI|Runway|ElevenLabs|Claude|Gemini|Kling|Sora/i,
    );
  });

  it('builds an editable structured Russian brief', () => {
    const prompt = buildCreateStudioPrompt({
      modeId: 'video',
      goal: 'Сделать рекламу страхования квартиры',
      audience: 'Владельцы ипотечных квартир',
      format: '9:16, до 20 секунд',
      context: 'Не называй конкретную страховую компанию',
    });

    assert.match(prompt, /Создай видео/i);
    assert.match(prompt, /Цель: Сделать рекламу страхования квартиры/);
    assert.match(prompt, /Аудитория: Владельцы ипотечных квартир/);
    assert.match(prompt, /Формат: 9:16, до 20 секунд/);
    assert.match(prompt, /Контекст: Не называй конкретную страховую компанию/);
    assert.match(prompt, /Сначала предложи концепцию/i);
    assert.match(prompt, /не запускай финальную генерацию/i);
  });

  it('omits empty optional fields cleanly', () => {
    const prompt = buildCreateStudioPrompt({
      modeId: 'document',
      goal: 'Подготовить коммерческое предложение',
      audience: '',
      format: '',
      context: '',
    });

    assert.match(prompt, /Создай документ/i);
    assert.doesNotMatch(prompt, /Аудитория:/);
    assert.doesNotMatch(prompt, /Формат:/);
    assert.doesNotMatch(prompt, /Контекст:/);
  });
});
