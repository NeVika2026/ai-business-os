import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildFirstLessonPrompt } from '@/components/public/PromptLessonLab';

test('first lesson builds a task-specific Russian prompt', () => {
  const result = buildFirstLessonPrompt({
    role: 'маркетолог',
    task: 'написать объявление',
    audience: 'покупатели квартиры',
    format: 'три абзаца',
  });
  assert.match(result, /маркетолог/);
  assert.match(result, /написать объявление/);
  assert.match(result, /покупатели квартиры/);
  assert.match(result, /три абзаца/);
  assert.match(result, /Пиши на русском языке/);
  assert.match(result, /Не придумывай факты/);
});

test('first lesson refuses missing fields', () => {
  const result = buildFirstLessonPrompt({
    role: '   ',
    task: 'создать пост',
    audience: 'предприниматели',
    format: 'коротко',
  });
  assert.equal(result, '');
});

test('first lesson limits overly long user input', () => {
  const result = buildFirstLessonPrompt({
    role: 'р'.repeat(700),
    task: 'з'.repeat(700),
    audience: 'а'.repeat(700),
    format: 'ф'.repeat(700),
  });
  assert.ok(!result.includes('р'.repeat(141)));
  assert.ok(!result.includes('з'.repeat(281)));
});
