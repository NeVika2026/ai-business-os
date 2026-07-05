import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetExecutiveState } from '@/lib/executive/executive-state';
import { publishRuntimeEvent, resetRuntimeEventStore, findProjectRuntimeEvents } from '@/lib/events/event-runtime';
import { resetMemoryStore } from '@/lib/memory/memory-engine';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { advanceAiOrchestraForProject } from '@/lib/project-lifecycle/ai-orchestra-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import { buildExecutiveMemory } from '@/utils/workspace/executive-memory';

const scope = {
  organizationId: 'org-exec-memory',
  userId: 'user-exec-memory',
};

function baseContext() {
  return {
    header: {
      title: 'Private Alpha',
      description: 'Investor demo',
      status: 'В работе',
      lastActivity: '2026-07-05T09:00:00.000Z',
    },
    today: {
      headline: 'Сегодня — Private Alpha',
      mission: 'Подготовить Investor Demo',
      nextStep: 'Проверить сценарий Investor Demo',
      priority: 'проектирование',
      progressPercent: 42,
      lastResult: null,
    },
    lifecycle: null,
    orchestra: null,
    executiveSummary: 'Анализ бизнеса · новая задача',
  };
}

describe('Executive Memory', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
    resetRuntimeEventStore();
  });

  it('builds decision entries with reason, consequence and recommendation', () => {
    publishRuntimeEvent({
      projectId: 'project-memory-1',
      type: RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_STARTED,
      actor: 'user:test',
      source: 'project_lifecycle',
      timestamp: '2026-07-02T09:12:00.000Z',
      payload: { projectName: 'Private Alpha' },
    });

    publishRuntimeEvent({
      projectId: 'project-memory-1',
      type: RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_COMPLETED,
      actor: 'system:project-lifecycle',
      source: 'project_lifecycle',
      timestamp: '2026-07-02T09:13:00.000Z',
      payload: { detectedType: 'marketing', specialistCount: 3 },
    });

    const memory = buildExecutiveMemory(
      findProjectRuntimeEvents('project-memory-1', getRuntimeStorage()),
      baseContext(),
    );

    assert.equal(memory.isEmpty, false);
    assert.equal(memory.entries.length, 2);
    assert.match(memory.entries[0]?.title ?? '', /Создан проект/);
    assert.ok(memory.entries[0]?.reason);
    assert.ok(memory.entries[0]?.consequence);
    assert.ok(memory.entries[0]?.nextRecommendation);
    assert.match(memory.entries[1]?.title ?? '', /Executive Brain определил тип проекта/);
    assert.equal(
      memory.entries.at(-1)?.nextRecommendation,
      'Проверить сценарий Investor Demo',
    );
  });

  it('excludes noisy workspace load events', () => {
    publishRuntimeEvent({
      projectId: 'project-memory-2',
      type: RUNTIME_EVENT_TYPES.WORKSPACE_LOADED,
      actor: 'user:test',
      source: 'workspace',
      payload: {},
    });

    publishRuntimeEvent({
      projectId: 'project-memory-2',
      type: RUNTIME_EVENT_TYPES.ORCHESTRA_INITIALIZED,
      actor: 'system:ai-orchestra',
      source: 'ai_orchestra',
      payload: { agentCount: 3, activeAgentId: 'discovery:business-manager:0' },
    });

    const memory = buildExecutiveMemory(
      findProjectRuntimeEvents('project-memory-2', getRuntimeStorage()),
      baseContext(),
    );

    assert.equal(memory.entries.length, 1);
    assert.match(memory.entries[0]?.title ?? '', /AI Orchestra/);
  });

  it('builds memory from lifecycle and orchestra progression', () => {
    runProjectLifecycle({
      projectId: 'project-memory-3',
      name: 'Executive Memory Demo',
      description: 'Маркетинговый запуск',
      declaredType: 'marketing',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    advanceAiOrchestraForProject('project-memory-3', scope, {
      organizationId: scope.organizationId,
      userId: scope.userId,
      goal: 'create_content',
    });

    const memory = buildExecutiveMemory(
      findProjectRuntimeEvents('project-memory-3', getRuntimeStorage()),
      {
        ...baseContext(),
        header: { ...baseContext().header, title: 'Executive Memory Demo' },
        lifecycle: {
          projectId: 'project-memory-3',
          projectName: 'Executive Memory Demo',
          detectedType: 'marketing',
          detectedTypeLabel: 'Маркетинг',
          specialists: [],
          workPlan: [{ title: 'Подготовить контент-план', estimate: '≈ 1 час', priorityLabel: 'Высокий' }],
          executiveBrief: 'Brief',
          firstStepPrompt: 'Начать контент-план',
          organizedAt: '2026-07-02T09:00:00.000Z',
        },
      },
    );

    assert.ok(memory.entries.some((entry) => entry.title.includes('Создан проект')));
    assert.ok(memory.entries.some((entry) => entry.title.includes('AI Orchestra')));
    assert.ok(memory.entries.some((entry) => entry.title.includes('завершил этап')));
    assert.ok(
      memory.entries.every(
        (entry) => entry.reason && entry.consequence && entry.nextRecommendation && entry.dateLabel,
      ),
    );
  });
});
