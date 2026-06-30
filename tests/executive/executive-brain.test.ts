import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  applyExecutiveBrain,
  evaluateExecutiveDecision,
  getLastExecutiveDecision,
} from '@/lib/executive/executive-engine';
import { resetExecutiveState } from '@/lib/executive/executive-state';
import { detectExecutiveGoal } from '@/lib/executive/executive-goals';
import {
  decideNavigatorMode,
  decideProjectAction,
  decideWorkingMode,
} from '@/lib/executive/executive-next-action';
import { buildExecutiveContext } from '@/lib/executive/executive-context';
import { applyGatewayMemoryInjection } from '@/lib/memory/gateway-memory';
import { captureGatewayMemory, resetMemoryStore } from '@/lib/memory/memory-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { createProjectRuntime } from '@/lib/project-runtime/project-runtime-engine';
import { setActiveProject } from '@/lib/project-runtime/active-project';
import type { GatewayRequest } from '@/types/runtime/dto';

const scope = {
  organizationId: 'org-exec',
  userId: 'user-exec',
};

function buildGatewayRequest(overrides: Partial<GatewayRequest> = {}): GatewayRequest {
  return {
    scope: {
      organizationId: scope.organizationId,
      userId: scope.userId,
    },
    trace: {
      runId: crypto.randomUUID(),
      traceId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    },
    providerCode: 'auto',
    modelCode: 'auto',
    messages: [
      {
        role: 'user',
        content: 'Найти новых клиентов для SaaS продукта',
      },
    ],
    tools: [],
    parameters: {
      temperature: 0.3,
      maxTokens: 256,
    },
    timeoutMs: 30_000,
    retryPolicy: {
      maxAttempts: 1,
      backoffMs: [100],
    },
    ...overrides,
  };
}

describe('OSA Executive Brain', () => {
  beforeEach(() => {
    resetExecutiveState();
    resetProjectRuntimeStore();
    resetMemoryStore();
  });

  it('detects executive goals from user task', () => {
    assert.equal(detectExecutiveGoal('Найти больше клиентов'), 'find_clients');
    assert.equal(detectExecutiveGoal('Написать пост для Telegram'), 'create_content');
    assert.equal(detectExecutiveGoal('Проанализировать бизнес и метрики'), 'business_analysis');
    assert.equal(detectExecutiveGoal('Спроектировать runtime pipeline'), 'design');
    assert.equal(detectExecutiveGoal('Объясни как работает память'), 'learning');
    assert.equal(detectExecutiveGoal('Сделать что-нибудь'), 'other');
  });

  it('evaluates a full executive decision', () => {
    const decision = evaluateExecutiveDecision(buildGatewayRequest());

    assert.equal(decision.goal, 'find_clients');
    assert.equal(decision.workingMode, 'new_task');
    assert.equal(decision.projectDecision, 'create_new');
    assert.equal(decision.memoryMode, 'none');
    assert.match(decision.summary, /поиск клиентов/);
    assert.ok(decision.reasoning.length >= 4);
    assert.ok(decision.confidence > 0);
  });

  it('chooses continuation mode for active project cues', () => {
    const runtime = createProjectRuntime({
      id: 'project-active',
      title: 'FAMALL',
      organizationId: scope.organizationId,
      userId: scope.userId,
      lastActivity: '2026-06-30T10:00:00.000Z',
    });

    setActiveProject(scope, runtime.id);

    const context = buildExecutiveContext(
      buildGatewayRequest({
        messages: [{ role: 'user', content: 'Продолжить работу над воронкой продаж' }],
      }),
    );

    assert.equal(decideWorkingMode(context), 'continuation');
    assert.equal(
      decideProjectAction(context, 'find_clients', 'continuation'),
      'continue_active',
    );
    assert.equal(decideNavigatorMode('find_clients', 'continue_active', 'continuation'), 'scale');
  });

  it('skips memory injection when executive decision uses memoryMode none', () => {
    const { request, decision } = applyExecutiveBrain(
      buildGatewayRequest({
        messages: [{ role: 'user', content: 'Объясни что такое Executive Brain' }],
      }),
    );

    assert.equal(decision.goal, 'learning');
    assert.equal(decision.memoryMode, 'none');

    const injected = applyGatewayMemoryInjection(request, decision);

    assert.equal(injected.messages.length, request.messages.length);
  });

  it('uses project memory when executive decision requires it', () => {
    const runtime = createProjectRuntime({
      id: 'project-os',
      title: 'AI Business OS',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    setActiveProject(scope, runtime.id);

    captureGatewayMemory({
      task: 'Подключить Project Runtime',
      result: 'Runtime готов',
      intent: 'project_runtime',
      routingCategory: 'planning',
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'AI Business OS',
    });

    const { request, decision } = applyExecutiveBrain(
      buildGatewayRequest({
        messages: [{ role: 'user', content: 'Продолжить работу над AI Business OS' }],
        scope: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          projectId: runtime.id,
        },
      }),
    );

    assert.equal(decision.memoryMode, 'project');

    const injected = applyGatewayMemoryInjection(request, decision);
    const systemContent = injected.messages[0]?.content ?? '';

    assert.match(systemContent, /AI Business OS/);
    assert.match(systemContent, /Runtime/);
  });

  it('stores the latest executive decision by scope', () => {
    applyExecutiveBrain(buildGatewayRequest());

    const stored = getLastExecutiveDecision(scope);

    assert.ok(stored);
    assert.equal(stored?.goal, 'find_clients');
    assert.ok(stored?.summary.length > 0);
  });

  it('creates a project runtime when executive decision is create_new', () => {
    const { decision } = applyExecutiveBrain(
      buildGatewayRequest({
        messages: [{ role: 'user', content: 'Создать новый проект для контента' }],
      }),
    );

    assert.equal(decision.projectDecision, 'create_new');

    const stored = getLastExecutiveDecision(scope);

    assert.ok(stored);
  });

  it('never exposes reasoning in summary', () => {
    const decision = evaluateExecutiveDecision(buildGatewayRequest());

    for (const line of decision.reasoning) {
      assert.ok(!decision.summary.includes(line));
    }
  });
});
