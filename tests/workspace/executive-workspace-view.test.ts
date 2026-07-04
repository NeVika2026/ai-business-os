import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetExecutiveState } from '@/lib/executive/executive-state';
import { createProjectRuntime } from '@/lib/project-runtime/project-runtime-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { buildExecutiveWorkspaceView } from '@/utils/workspace/executive-workspace-view';
import type { OsaWorkspacePageData } from '@/utils/workspace/workspace-types';

const scope = {
  organizationId: 'org-exec',
  userId: 'user-exec',
};

function baseData(overrides: Partial<OsaWorkspacePageData> = {}): OsaWorkspacePageData {
  return {
    projectId: 'project-exec',
    userName: 'Виктория',
    header: {
      title: 'AI Business OS',
      description: 'Executive Workspace для OSA',
      status: 'В работе',
      lastActivity: '2026-03-30T09:00:00.000Z',
    },
    today: {
      headline: 'Сегодня — Executive Workspace',
      mission: 'После этого команда сможет начать разработку Executive Workspace.',
      nextStep: 'Подтвердить архитектуру Navigator',
      priority: 'проектирование',
      progressPercent: 24,
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
      ],
    },
    timeline: [],
    scope,
    ...overrides,
  };
}

describe('Executive Workspace view', () => {
  beforeEach(() => {
    resetProjectRuntimeStore();
    resetExecutiveState();
  });

  it('builds a single dominant focus block from today next step', () => {
    const view = buildExecutiveWorkspaceView(baseData());

    assert.equal(view.focus.label, 'Следующий лучший шаг');
    assert.match(view.focus.title, /Navigator/);
    assert.match(view.focus.reason, /Executive Workspace/);
    assert.equal(view.focus.ctaLabel, 'Продолжить →');
    assert.match(view.focus.prompt, /AI Business OS/);
  });

  it('surfaces executive brief and live team states', () => {
    createProjectRuntime({
      id: 'project-exec',
      title: 'AI Business OS',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    const view = buildExecutiveWorkspaceView(
      baseData({
        timeline: [
          {
            id: 'entry-1',
            task: 'Workspace',
            result: 'Designer закончил Home',
            decision: 'Продолжить',
            occurredAt: '2026-03-30T08:00:00.000Z',
          },
        ],
      }),
    );

    assert.ok(view.brief.some((item) => item.text === 'Memory обновлена'));
    assert.equal(view.team.length, 3);
    assert.match(view.team[0]?.role ?? '', /Business Manager/);
    assert.ok(view.memoryLine);
  });
});
