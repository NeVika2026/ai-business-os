import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  CREATE_STUDIO_MODES,
  buildCreateStudioPrompt,
  getCreateStudioProductionLine,
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

  it('defines a full production line for video without provider names', () => {
    const line = getCreateStudioProductionLine('video');

    assert.deepEqual(
      line.map((stage) => stage.label),
      ['Идея', 'Сценарий', 'Раскадровка', 'Визуал', 'Сцены', 'Голос', 'Субтитры', 'Монтаж', 'QA', 'Экспорт'],
    );
    assert.doesNotMatch(JSON.stringify(line), /Runway|ElevenLabs|Kling|Sora|OpenAI/i);
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
    assert.match(prompt, /Идея → Сценарий → Раскадровка → Визуал → Сцены → Голос → Субтитры → Монтаж → QA → Экспорт/);
    assert.match(prompt, /единый визуальный мир/i);
    assert.match(prompt, /не запускай затратную генерацию/i);
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

  it('renders the production conveyor in the studio UI', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'components', 'platform', 'CreateStudio.tsx'),
      'utf8',
    );

    assert.match(source, /Производственная линия/);
    assert.match(source, /getCreateStudioProductionLine/);
    assert.match(source, /Передать AI-директору/);
    assert.match(source, /Идею можно описать одной фразой/);
  });
});
