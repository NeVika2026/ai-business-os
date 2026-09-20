import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  listBusinessFactoryKnowledgeSources,
  resolveBusinessFactorySourceId,
} from '@/services/knowledge/business-factory-knowledge';
import {
  routeBusinessFactoryKnowledge,
  serializeBusinessFactoryKnowledgeForRuntime,
} from '@/services/knowledge/business-factory-router';

describe('Business Factory curated knowledge', () => {
  it('deduplicates repeated uploads through canonical source aliases', () => {
    assert.equal(resolveBusinessFactorySourceId('Артур.pdf'), 'nagornova-artur');
    assert.equal(resolveBusinessFactorySourceId('Артур(1).pdf'), 'nagornova-artur');
    assert.equal(
      resolveBusinessFactorySourceId(
        'Бесплатная_генерация_видео_ИИ_что_осталось_после_закрытия_Sora(1).pdf',
      ),
      'video-tools-2026',
    );

    const sources = listBusinessFactoryKnowledgeSources();
    assert.equal(
      sources.filter((source) => source.id === 'nagornova-artur').length,
      1,
    );
  });

  it('routes viral content requests to the viral format engine', () => {
    const methods = routeBusinessFactoryKnowledge({
      query: 'Сделай вирусный контент-план для Telegram и сторис на две недели',
      selectedAgentIds: ['content', 'marketing'],
    });

    assert.ok(methods.length > 0);
    assert.equal(methods[0].id, 'viral-format-engine');
    assert.ok(methods[0].score > 0);
  });

  it('routes audience research to segmentation methods', () => {
    const methods = routeBusinessFactoryKnowledge({
      query: 'Проведи сегментацию ЦА, найди микросегменты и боли клиента',
      selectedAgentIds: ['marketing', 'analyst'],
    });

    assert.ok(methods.some((method) => method.id === 'audience-matryoshka'));
    assert.ok(methods.some((method) => method.id === 'buyer-persona-deep-dive'));
  });

  it('marks video provider knowledge as time-sensitive and keeps safety guardrails', () => {
    const methods = routeBusinessFactoryKnowledge({
      query: 'Подбери генератор видео без VPN, желательно Kling, Wan или Veo',
      selectedAgentIds: ['content'],
    });

    const videoRouter = methods.find((method) => method.id === 'video-provider-router');
    assert.ok(videoRouter);
    assert.equal(videoRouter.freshness, 'time-sensitive');
    assert.ok(videoRouter.guardrails.length > 0);

    const serialized = serializeBusinessFactoryKnowledgeForRuntime([videoRouter]);
    assert.equal(serialized[0].freshness, 'time-sensitive');
  });

  it('does not inject methods from agent identity alone', () => {
    const methods = routeBusinessFactoryKnowledge({
      query: 'Собери презентацию по этим данным',
      selectedAgentIds: ['content', 'marketing'],
    });

    assert.deepEqual(methods, []);
  });

  it('keeps deterministic ordering for identical requests', () => {
    const input = {
      query: 'Напиши живой человеческий текст без машинных клише',
      selectedAgentIds: ['content'],
      limit: 5,
    };

    const first = routeBusinessFactoryKnowledge(input).map((method) => method.id);
    const second = routeBusinessFactoryKnowledge(input).map((method) => method.id);

    assert.deepEqual(first, second);
  });
});
