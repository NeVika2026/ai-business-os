import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetExecutiveState } from '@/lib/executive/executive-state';
import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { detectProjectType } from '@/lib/project-lifecycle/detect-project-type';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { selectProjectSpecialists } from '@/lib/project-lifecycle/select-specialists';
import { findMemory } from '@/lib/memory/memory-engine';
import { resetMemoryStore } from '@/lib/memory/memory-engine';
import { findProjectRuntime } from '@/lib/project-runtime/project-runtime-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { loadProjectLifecycleSnapshot } from '@/lib/storage/project-lifecycle-storage';
import { loadAiOrchestraState } from '@/lib/storage/ai-orchestra-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';

const scope = {
  organizationId: 'org-lifecycle',
  userId: 'user-lifecycle',
};

describe('Project Lifecycle', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
  });

  it('detects project type from description when declared type is general', () => {
    assert.equal(
      detectProjectType({
        declaredType: 'general',
        name: 'Growth',
        description: 'Нужен маркетинг и контент для запуска',
      }),
      'marketing',
    );
  });

  it('selects specialists for project type', () => {
    const team = selectProjectSpecialists('crm');

    assert.equal(team.length, 3);
    assert.match(team[0]?.role ?? '', /Business Manager/);
  });

  it('runs full lifecycle after project creation', () => {
    const result = runProjectLifecycle({
      projectId: 'project-lifecycle-1',
      name: 'Private Alpha',
      description: 'Подготовить investor demo',
      declaredType: 'general',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    assert.match(result.workspacePath, /project-lifecycle-1/);
    assert.equal(result.snapshot.workPlan.length, 3);
    assert.match(result.snapshot.firstStepPrompt, /Private Alpha/);

    const runtime = findProjectRuntime('project-lifecycle-1');
    assert.ok(runtime);
    assert.match(runtime.nextStep, /Private Alpha/);
    assert.ok(runtime.summary.includes('Executive Brief'));

    const executive = getLastExecutiveDecision(scope);
    assert.equal(executive?.projectId, 'project-lifecycle-1');
    assert.equal(executive?.navigatorMode, 'next_step');

    const memory = findMemory({
      organizationId: scope.organizationId,
      userId: scope.userId,
      limit: 5,
    });
    assert.ok(memory.some((entry) => entry.task.includes('OSA организовала проект')));

    const stored = loadProjectLifecycleSnapshot(getRuntimeStorage(), 'project-lifecycle-1');
    assert.ok(stored);
    assert.equal(stored.projectName, 'Private Alpha');

    const orchestra = loadAiOrchestraState(getRuntimeStorage(), 'project-lifecycle-1');
    assert.ok(orchestra);
    assert.equal(orchestra.projectId, 'project-lifecycle-1');
    assert.ok(orchestra.queue.length >= 3);
    assert.equal(orchestra.queue.filter((agent) => agent.status === 'working').length, 1);
  });
});
