import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildFirstResultPresentation,
  pickFirstResultWowPhrase,
} from '@/utils/first-experience/first-result-presentation';
import { OSA_WOW_PHRASES } from '@/utils/first-experience/osa-voice';

describe('first result presentation', () => {
  it('picks one of the wow phrases deterministically', () => {
    const phrase = pickFirstResultWowPhrase('Подготовить план продаж');

    assert.ok(OSA_WOW_PHRASES.includes(phrase as (typeof OSA_WOW_PHRASES)[number]));
  });

  it('splits the first two lines into key insight', () => {
    const presentation = buildFirstResultPresentation(
      [
        'Ваш проект сейчас ограничивает не маркетинг.',
        'Главная проблема — отсутствие понятного позиционирования.',
        '1. Уточнить цель на неделю.',
        '2. Запустить первый тест.',
      ].join('\n'),
    );

    assert.equal(presentation.summaryLines.length, 2);
    assert.match(presentation.summaryLines[0] ?? '', /маркетинг/);
    assert.match(presentation.body, /Уточнить цель/);
    assert.ok(OSA_WOW_PHRASES.includes(presentation.wowPhrase as (typeof OSA_WOW_PHRASES)[number]));
  });

  it('keeps short results in summary only', () => {
    const presentation = buildFirstResultPresentation('Короткий вывод.\nВторой вывод.');

    assert.equal(presentation.summaryLines.length, 2);
    assert.equal(presentation.body, '');
  });
});
