import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  buildGatewayMemoryContext,
  buildProjectContext,
  buildRecentContext,
  GATEWAY_MEMORY_CONTEXT_MAX_CHARS,
} from '@/lib/memory/context-builder';
import { captureGatewayMemory, createMemoryStore, resetMemoryStore } from '@/lib/memory/memory-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { ensureProject } from '@/lib/memory/memory-projects';

describe('OSA Memory Context Builder', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
  });

  it('returns empty context when memory is empty', () => {
    const context = buildGatewayMemoryContext({
      organizationId: 'org-1',
      userId: 'user-1',
    });

    assert.equal(context.hasMemory, false);
    assert.equal(context.content, '');
    assert.equal(context.entryCount, 0);
  });

  it('builds recent context for a user without project', () => {
    const store = createMemoryStore();

    captureGatewayMemory(
      {
        task: 'Создать Navigator',
        result: 'Navigator UI готов',
        intent: 'navigator_ui',
        routingCategory: 'planning',
        organizationId: 'org-1',
        userId: 'user-1',
      },
      store,
    );

    captureGatewayMemory(
      {
        task: 'Добавить Runtime Memory',
        result: 'Memory Engine foundation готов',
        intent: 'memory_foundation',
        routingCategory: 'planning',
        organizationId: 'org-1',
        userId: 'user-1',
      },
      store,
    );

    const recent = buildRecentContext(
      {
        organizationId: 'org-1',
        userId: 'user-1',
      },
      store,
    );

    assert.equal(recent.entries.length, 2);
    assert.equal(recent.lines.length, 2);
    assert.match(recent.currentObjective ?? '', /Runtime Memory/);
  });

  it('builds project context when projectId is provided', () => {
    const store = createMemoryStore();
    const project = ensureProject(
      {
        organizationId: 'org-1',
        name: 'AI Business OS',
        userId: 'user-1',
      },
      store,
    );

    captureGatewayMemory(
      {
        task: 'Подключить Memory Injection',
        result: 'Context Builder подключён',
        intent: 'memory_injection',
        routingCategory: 'planning',
        organizationId: 'org-1',
        userId: 'user-1',
        projectId: project.id,
      },
      store,
    );

    const projectContext = buildProjectContext(
      {
        organizationId: 'org-1',
        projectId: project.id,
      },
      store,
    );

    assert.match(projectContext ?? '', /AI Business OS/);

    const gatewayContext = buildGatewayMemoryContext(
      {
        organizationId: 'org-1',
        userId: 'user-1',
        projectId: project.id,
      },
      store,
    );

    assert.equal(gatewayContext.hasMemory, true);
    assert.match(gatewayContext.content, /Current Project:/);
    assert.match(gatewayContext.content, /AI Business OS/);
    assert.match(gatewayContext.content, /Recent Progress:/);
    assert.match(gatewayContext.content, /Continue from previous work\./);
    assert.ok(gatewayContext.content.length <= GATEWAY_MEMORY_CONTEXT_MAX_CHARS);
  });

  it('limits gateway context size', () => {
    const store = createMemoryStore();

    for (let index = 0; index < 12; index += 1) {
      captureGatewayMemory(
        {
          task: `Задача ${index}`,
          result: `Результат ${index} `.repeat(40),
          intent: `intent_${index}`,
          routingCategory: 'planning',
          organizationId: 'org-1',
          userId: 'user-1',
        },
        store,
      );
    }

    const context = buildGatewayMemoryContext(
      {
        organizationId: 'org-1',
        userId: 'user-1',
        limit: 12,
      },
      store,
    );

    assert.equal(context.hasMemory, true);
    assert.ok(context.content.length <= GATEWAY_MEMORY_CONTEXT_MAX_CHARS);
  });
});
