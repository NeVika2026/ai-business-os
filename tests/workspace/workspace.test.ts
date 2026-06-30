import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { captureGatewayMemory, resetMemoryStore } from '@/lib/memory/memory-engine';
import { createProjectRuntime } from '@/lib/project-runtime/project-runtime-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { resetExecutiveState } from '@/lib/executive/executive-state';
import { buildWorkspaceTimeline } from '@/utils/workspace/workspace-timeline';

const scope = {
  organizationId: 'org-ws',
  userId: 'user-ws',
};

describe('OSA Workspace', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
  });

  it('builds project decision timeline from memory engine', () => {
    const runtime = createProjectRuntime({
      id: 'project-ws',
      title: 'AI Business OS',
      organizationId: scope.organizationId,
      userId: scope.userId,
      sourceProjectId: 'project-ws',
    });

    captureGatewayMemory({
      task: 'Создать Workspace',
      result: 'Workspace UI готов',
      intent: 'workspace',
      routingCategory: 'planning',
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'AI Business OS',
    });

    const timeline = buildWorkspaceTimeline(runtime);

    assert.equal(timeline.length, 1);
    assert.match(timeline[0]?.task ?? '', /Workspace/);
    assert.match(timeline[0]?.result ?? '', /готов/);
    assert.match(timeline[0]?.decision ?? '', /Workspace/);
    assert.ok(timeline[0]?.occurredAt);
  });

  it('isolates timeline entries per project', () => {
    createProjectRuntime({
      id: 'project-a',
      title: 'Telegram',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    const runtimeB = createProjectRuntime({
      id: 'project-b',
      title: 'YouTube',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    captureGatewayMemory({
      task: 'Telegram пост',
      result: 'Черновик готов',
      intent: 'content',
      routingCategory: 'writing',
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'Telegram',
    });

    captureGatewayMemory({
      task: 'YouTube сценарий',
      result: 'Outline готов',
      intent: 'content',
      routingCategory: 'writing',
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'YouTube',
    });

    const timeline = buildWorkspaceTimeline(runtimeB);

    assert.equal(timeline.length, 1);
    assert.match(timeline[0]?.task ?? '', /YouTube/);
    assert.doesNotMatch(timeline[0]?.task ?? '', /Telegram/);
  });
});
