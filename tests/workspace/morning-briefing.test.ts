import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { captureGatewayMemory, resetMemoryStore } from '@/lib/memory/memory-engine';
import { resetExecutiveState } from '@/lib/executive/executive-state';
import { createProjectRuntime } from '@/lib/project-runtime/project-runtime-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import {
  buildMorningBriefing,
  dismissMorningBriefing,
  hasDismissedMorningBriefing,
  morningBriefingStorageKey,
} from '@/utils/workspace/morning-briefing';
import { buildProjectReplay } from '@/utils/workspace/project-replay';
import type { OsaWorkspacePageData } from '@/utils/workspace/workspace-types';

const scope = {
  organizationId: 'org-morning',
  userId: 'user-morning',
};

function baseData(overrides: Partial<OsaWorkspacePageData> = {}): OsaWorkspacePageData {
  return {
    projectId: 'project-morning',
    userName: 'Виктория Иванова',
    header: {
      title: 'Private Alpha',
      description: 'Закрытый запуск OSA',
      status: 'В работе',
      lastActivity: '2026-03-30T09:00:00.000Z',
    },
    today: {
      headline: 'Сегодня — Private Alpha',
      mission: 'Подготовить Investor Demo',
      nextStep: 'Закончить Navigator',
      priority: 'проектирование',
      progressPercent: 92,
      lastResult: null,
    },
    navigator: {
      title: 'Следующий лучший шаг',
      subtitle: 'Выберите направление',
      steps: [
        {
          id: 'build_system',
          emoji: '',
          title: 'Построить систему',
          description: 'Разложить процесс на этапы.',
          buttonLabel: 'Выбрать',
        },
        {
          id: 'quick_result',
          emoji: '',
          title: 'Быстро получить результат',
          description: 'Сосредоточиться на действиях.',
          buttonLabel: 'Выбрать',
        },
        {
          id: 'scale',
          emoji: '',
          title: 'Масштабировать',
          description: 'Подготовить к росту.',
          buttonLabel: 'Выбрать',
        },
      ],
    },
    timeline: [],
    lifecycle: null,
    orchestra: null,
    replay: buildProjectReplay([], 'Private Alpha'),
    scope,
    ...overrides,
  };
}

describe('Morning Briefing', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
  });

  it('builds greeting and three runtime-backed actions', () => {
    const briefing = buildMorningBriefing(baseData(), 'Виктория Иванова');

    assert.match(briefing.greeting, /Доброе утро, Виктория/);
    assert.match(briefing.intro, /три действия/);
    assert.equal(briefing.actions.length, 3);
    assert.equal(briefing.actions[0]?.title, 'Закончить Navigator');
    assert.equal(briefing.actions[0]?.priorityLabel, 'Высокий приоритет');
    assert.match(briefing.progressLine, /Private Alpha на 92%/);
    assert.equal(briefing.ctaLabel, 'Начать работу');
  });

  it('uses memory and navigator when building action list', () => {
    createProjectRuntime({
      id: 'project-morning',
      title: 'Private Alpha',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    captureGatewayMemory({
      task: 'Проверить Executive Workspace',
      result: 'Executive Workspace готов',
      intent: 'design',
      routingCategory: 'planning',
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'Private Alpha',
    });

    const briefing = buildMorningBriefing(
      baseData({
        timeline: [
          {
            id: 'entry-1',
            task: 'Проверить Executive Workspace',
            result: 'Executive Workspace готов',
            decision: 'Продолжить',
            occurredAt: '2026-03-30T08:00:00.000Z',
          },
        ],
      }),
      null,
    );

    assert.ok(briefing.actions.some((action) => action.title.includes('Executive Workspace')));
    assert.ok(briefing.actions.some((action) => action.title.includes('Investor Demo')));
  });

  it('tracks daily dismissal in localStorage', () => {
    const date = new Date('2026-03-30T10:00:00.000Z');
    const key = morningBriefingStorageKey('project-morning', date);

    assert.equal(hasDismissedMorningBriefing('project-morning', date), false);
    dismissMorningBriefing('project-morning', date);
    assert.equal(hasDismissedMorningBriefing('project-morning', date), false);
    assert.equal(key.includes('2026-03-30'), true);
  });
});
