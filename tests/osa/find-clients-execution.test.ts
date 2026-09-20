import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildFindClientsAgentPayload } from '@/utils/osa/find-clients-execution';

describe('find clients knowledge routing', () => {
  it('injects audience and sales methods into the specialized OSA path', () => {
    const payload = buildFindClientsAgentPayload(
      {
        userPrompt: 'Найди клиентов для услуги и раздели целевую аудиторию на сегменты',
        businessDescription: 'B2B-консалтинг для малого бизнеса',
        selectedAgents: [
          { id: 'business-manager', name: 'Business Manager' },
          { id: 'marketing', name: 'Marketing' },
          { id: 'sales', name: 'Sales' },
        ],
        executionPlan: {
          stages: [],
          dependencies: {},
          parallelGroups: [],
          estimatedMinutes: 10,
          risks: [],
          executionMode: 'sequential',
          reviewRequired: true,
        },
        goalId: 'find_clients',
        goalTitle: 'Найти клиентов',
        projectId: 'project-1',
      },
      'session-1',
      'run-1',
    );

    const methods = payload.business_factory_knowledge as Array<{ id: string }>;

    assert.match(String(payload.knowledgeQuery), /Найди клиентов/);
    assert.match(String(payload.knowledgeQuery), /целевая аудитория/);
    assert.ok(methods.length > 0);
    assert.ok(
      methods.some((method) =>
        ['audience-matryoshka', 'buyer-persona-deep-dive', 'sales-ai-system'].includes(method.id),
      ),
    );
    assert.ok(methods.length <= 5);
  });
});
