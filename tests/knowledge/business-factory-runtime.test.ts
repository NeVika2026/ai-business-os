import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createBusinessFactoryRuntimeKnowledgeAdapter } from '@/services/knowledge/business-factory-runtime';

describe('Business Factory full-text runtime knowledge', () => {
  it('retrieves the 3R content cycle for editorial-plan queries', () => {
    const adapter = createBusinessFactoryRuntimeKnowledgeAdapter('test-bf-3r');
    const results = adapter.search({
      query: 'контент-план расслабь раздразни разъясни 3Р Telegram',
      limit: 5,
    });

    assert.ok(results.length > 0);
    assert.ok(results.some((result) => result.title.includes('3Р')));
  });

  it('retrieves sales and funnel knowledge for client-acquisition queries', () => {
    const adapter = createBusinessFactoryRuntimeKnowledgeAdapter('test-bf-sales');
    const results = adapter.search({
      query: 'клиенты продажи воронка CRM скрипт возражения повторные продажи',
      limit: 6,
    });

    assert.ok(results.length > 0);
    assert.ok(results.some((result) => result.title.includes('Продажи и воронка')));
  });

  it('retrieves director and provider knowledge for AI-video queries', () => {
    const adapter = createBusinessFactoryRuntimeKnowledgeAdapter('test-bf-video');
    const results = adapter.search({
      query: 'сгенерировать видео сцена камера свет звук Kling Wan без VPN',
      limit: 6,
    });

    assert.ok(results.some((result) => result.title.includes('Режиссёрский шаблон')));
    assert.ok(results.some((result) => result.title.includes('AI-видео')));
  });

  it('keeps separate adapter instances isolated', () => {
    const first = createBusinessFactoryRuntimeKnowledgeAdapter('test-bf-a');
    const second = createBusinessFactoryRuntimeKnowledgeAdapter('test-bf-b');

    first.ingestMarkdown({
      title: 'Temporary private note',
      source: 'test-only',
      content: '# Temporary private note\nUniqueMarkerForIsolation',
    });

    assert.ok(first.search({ query: 'UniqueMarkerForIsolation' }).length > 0);
    assert.equal(second.search({ query: 'UniqueMarkerForIsolation' }).length, 0);
  });
});
