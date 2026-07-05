import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetExecutiveState } from '@/lib/executive/executive-state';
import { publishRuntimeEvent, resetRuntimeEventStore, findProjectRuntimeEvents } from '@/lib/events/event-runtime';
import { resetMemoryStore } from '@/lib/memory/memory-engine';
import { advanceAiOrchestraForProject } from '@/lib/project-lifecycle/ai-orchestra-engine';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import { buildProjectReplay } from '@/utils/workspace/project-replay';

const scope = {
  organizationId: 'org-replay',
  userId: 'user-replay',
};

describe('Project Replay', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
    resetRuntimeEventStore();
  });

  it('builds chronological replay scenes from runtime events', () => {
    publishRuntimeEvent({
      projectId: 'project-replay-1',
      type: RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_STARTED,
      actor: 'user:test',
      source: 'project_lifecycle',
      timestamp: '2026-07-05T09:12:00.000Z',
      payload: { projectName: 'Private Alpha' },
    });

    publishRuntimeEvent({
      projectId: 'project-replay-1',
      type: RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_COMPLETED,
      actor: 'system:project-lifecycle',
      source: 'project_lifecycle',
      timestamp: '2026-07-05T09:13:00.000Z',
      payload: { detectedType: 'marketing' },
    });

    publishRuntimeEvent({
      projectId: 'project-replay-1',
      type: RUNTIME_EVENT_TYPES.ORCHESTRA_INITIALIZED,
      actor: 'system:ai-orchestra',
      source: 'ai_orchestra',
      timestamp: '2026-07-05T09:13:30.000Z',
      payload: {
        agentCount: 3,
        activeAgentId: 'discovery:business-manager:0',
      },
    });

    const replay = buildProjectReplay(
      findProjectRuntimeEvents('project-replay-1', getRuntimeStorage()),
      'Private Alpha',
    );

    assert.equal(replay.isEmpty, false);
    assert.equal(replay.scenes[0]?.description, 'Создан проект «Private Alpha».');
    assert.match(replay.scenes[1]?.description ?? '', /Executive Brain определил тип проекта/);
    assert.match(replay.scenes[2]?.description ?? '', /Подобрана AI-команда/);
    assert.match(replay.scenes[3]?.description ?? '', /Business Manager начал работу/);
    assert.equal(replay.scenes[0]?.sourceLabel, 'Project Lifecycle');
    assert.equal(replay.scenes[0]?.icon, '◎');
    assert.match(replay.scenes[0]?.timeLabel ?? '', /^\d{2}:\d{2}$/);
  });

  it('excludes noisy workspace load events from replay', () => {
    publishRuntimeEvent({
      projectId: 'project-replay-2',
      type: RUNTIME_EVENT_TYPES.WORKSPACE_LOADED,
      actor: 'user:test',
      source: 'workspace',
      payload: {},
    });

    publishRuntimeEvent({
      projectId: 'project-replay-2',
      type: RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_STARTED,
      actor: 'user:test',
      source: 'project_lifecycle',
      payload: { projectName: 'Quiet Project' },
    });

    const replay = buildProjectReplay(
      findProjectRuntimeEvents('project-replay-2', getRuntimeStorage()),
      'Quiet Project',
    );

    assert.equal(replay.scenes.length, 1);
    assert.equal(replay.scenes[0]?.source, 'project_lifecycle');
  });

  it('maps lifecycle and orchestra progression into a decision story', () => {
    runProjectLifecycle({
      projectId: 'project-replay-3',
      name: 'Replay Demo',
      description: 'Маркетинговый запуск',
      declaredType: 'marketing',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    advanceAiOrchestraForProject('project-replay-3', scope, {
      organizationId: scope.organizationId,
      userId: scope.userId,
      goal: 'create_content',
    });

    publishRuntimeEvent({
      projectId: 'project-replay-3',
      type: RUNTIME_EVENT_TYPES.ORCHESTRA_BLOCKED_RESOLVED,
      actor: `user:${scope.userId}`,
      source: 'ai_orchestra',
      payload: {},
    });

    const replay = buildProjectReplay(
      findProjectRuntimeEvents('project-replay-3', getRuntimeStorage()),
      'Replay Demo',
    );

    assert.ok(replay.scenes.some((scene) => scene.description.includes('Создан проект')));
    assert.ok(replay.scenes.some((scene) => scene.description.includes('AI-команда')));
    assert.ok(replay.scenes.some((scene) => scene.description.includes('Решение подтверждено.')));
    assert.ok(replay.scenes.every((scene) => scene.icon && scene.timeLabel && scene.sourceLabel));
  });
});
