import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetExecutiveState } from '@/lib/executive/executive-state';
import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import {
  advanceAiOrchestraForProject,
  initializeAiOrchestra,
  recalculateOrchestraQueue,
} from '@/lib/project-lifecycle/ai-orchestra-engine';
import { orchestraStatusLabel } from '@/lib/project-lifecycle/build-ai-orchestra';
import { buildProjectWorkPlan } from '@/lib/project-lifecycle/build-work-plan';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { selectProjectSpecialists } from '@/lib/project-lifecycle/select-specialists';
import { resetMemoryStore } from '@/lib/memory/memory-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { loadAiOrchestraState } from '@/lib/storage/ai-orchestra-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';

const scope = {
  organizationId: 'org-orchestra',
  userId: 'user-orchestra',
};

describe('AI Orchestra', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
  });

  it('initializes orchestra queue from specialists and work plan', () => {
    const specialists = selectProjectSpecialists('marketing');
    const workPlan = buildProjectWorkPlan('marketing', 'Launch');

    const state = initializeAiOrchestra({
      projectId: 'project-orchestra-1',
      projectName: 'Launch',
      description: 'Контент и маркетинг для запуска',
      specialists,
      workPlan,
      organizationId: scope.organizationId,
      userId: scope.userId,
      goal: 'create_content',
    });

    assert.ok(state.queue.length >= 3);
    assert.equal(state.queue.filter((agent) => agent.status === 'working').length, 1);
    assert.ok(state.activeAgentId);
    assert.ok(state.overallProgress >= 0);
  });

  it('advances orchestra sequentially and updates executive reasoning', () => {
    runProjectLifecycle({
      projectId: 'project-orchestra-2',
      name: 'CRM Sprint',
      description: 'Найти клиентов и настроить CRM',
      declaredType: 'crm',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    const initial = loadAiOrchestraState(getRuntimeStorage(), 'project-orchestra-2');
    assert.ok(initial);

    const firstActive = initial.activeAgentId;
    const advanced = advanceAiOrchestraForProject('project-orchestra-2', scope, {
      organizationId: scope.organizationId,
      userId: scope.userId,
      goal: 'find_clients',
    });

    assert.ok(advanced);
    assert.notEqual(advanced.activeAgentId, firstActive);
    assert.equal(
      advanced.queue.filter((agent) => agent.status === 'completed').length,
      1,
    );

    const executive = getLastExecutiveDecision(scope);
    assert.ok(executive?.reasoning.some((entry) => entry.startsWith('orchestra=')));
  });

  it('recalculates queue when no agent is working', () => {
    const specialists = selectProjectSpecialists('general');
    const workPlan = buildProjectWorkPlan('general', 'General');

    const state = initializeAiOrchestra({
      projectId: 'project-orchestra-3',
      projectName: 'General',
      description: 'Общий проект',
      specialists,
      workPlan,
      organizationId: scope.organizationId,
      userId: scope.userId,
      goal: 'business_analysis',
    });

    const idle = {
      ...state,
      queue: state.queue.map((agent) =>
        agent.status === 'working'
          ? { ...agent, status: 'waiting' as const, progressPercent: 0 }
          : agent,
      ),
      activeAgentId: null,
    };

    const recalculated = recalculateOrchestraQueue(idle);

    assert.equal(
      recalculated.queue.filter((agent) => agent.status === 'working').length,
      1,
    );
  });

  it('labels orchestra statuses in Russian', () => {
    assert.equal(orchestraStatusLabel('waiting'), 'Ожидает');
    assert.equal(orchestraStatusLabel('working'), 'В работе');
    assert.equal(orchestraStatusLabel('blocked'), 'Нужно решение');
    assert.equal(orchestraStatusLabel('completed'), 'Готово');
  });
});
