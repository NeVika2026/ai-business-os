import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildClarificationQuestions,
  buildEnrichedRealWorkPrompt,
  classifyRealWorkTaskType,
  mapTaskTypeToDeliverableType,
  needsClarification,
} from '@/utils/home/real-work-mode';

describe('real work mode', () => {
  it('classifies task types from prompt keywords', () => {
    assert.equal(classifyRealWorkTaskType('Сделай лендинг для курса'), 'landing');
    assert.equal(classifyRealWorkTaskType('Нужна презентация для инвесторов'), 'presentation');
    assert.equal(classifyRealWorkTaskType('Маркетинговый план на квартал'), 'marketing');
    assert.equal(classifyRealWorkTaskType('Контент-план для Telegram'), 'content');
    assert.equal(classifyRealWorkTaskType('Скрипт продаж для холодных звонков'), 'sales');
    assert.equal(classifyRealWorkTaskType('Стратегия роста на год'), 'strategy');
  });

  it('maps quick actions to task types', () => {
    assert.equal(classifyRealWorkTaskType('', 'analysis'), 'analysis');
    assert.equal(classifyRealWorkTaskType('', 'plan'), 'strategy');
  });

  it('maps task types to deliverable types', () => {
    assert.equal(mapTaskTypeToDeliverableType('landing'), 'landing');
    assert.equal(mapTaskTypeToDeliverableType('presentation'), 'presentation');
    assert.equal(mapTaskTypeToDeliverableType('marketing'), 'marketing_plan');
    assert.equal(mapTaskTypeToDeliverableType('sales'), 'sales_script');
  });

  it('returns at most three clarification questions for short prompts', () => {
    const questions = buildClarificationQuestions('landing', 'Сделай лендинг');

    assert.ok(questions.length > 0);
    assert.ok(questions.length <= 3);
  });

  it('skips clarification when prompt is detailed enough', () => {
    const prompt =
      'Сделай лендинг для онлайн-курса по дизайну для начинающих фрилансеров с заявкой на бесплатный урок в Telegram';

    assert.equal(buildClarificationQuestions('landing', prompt).length, 0);
    assert.equal(needsClarification(prompt, 'landing'), false);
  });

  it('builds enriched prompt with clarifications', () => {
    const enriched = buildEnrichedRealWorkPrompt('Сделай лендинг', 'landing', [
      { question: 'Кто аудитория?', answer: 'Начинающие дизайнеры' },
    ]);

    assert.match(enriched, /Тип задачи: Лендинг/);
    assert.match(enriched, /Начинающие дизайнеры/);
    assert.match(enriched, /готовый рабочий результат/);
  });
});
