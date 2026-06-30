import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetMemoryStore } from '@/lib/memory/memory-engine';
import { captureGatewayMemory } from '@/lib/memory/memory-engine';
import {
  getActiveProject,
  resolveActiveProject,
  resolveGatewayProjectId,
  setActiveProject,
} from '@/lib/project-runtime/active-project';
import { DEFAULT_WORKSPACE_TITLE, isDefaultWorkspaceId } from '@/lib/project-runtime/constants';
import {
  createProjectRuntime,
  findProjectRuntime,
  listProjectRuntimes,
  updateProjectRuntime,
} from '@/lib/project-runtime/project-runtime-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { syncProjectMemoryState, recordProjectRuntimeFromGateway } from '@/lib/project-runtime/project-runtime-memory';
import { buildNavigatorStepsForProject } from '@/lib/project-runtime/navigator-steps';
import { buildProjectTodayBriefing } from '@/lib/project-runtime/today-briefing';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';

const scope = {
  organizationId: 'org-pr',
  userId: 'user-pr',
};

function emptySnapshot(): CabinetRawSnapshot {
  return {
    runs: [],
    events: [],
    organization: { id: 'org-pr', name: 'Org', settings: {}, created_at: '2026-06-30T10:00:00.000Z' },
    projects: [],
    projectCount: 0,
    workspaceCount: 0,
    agentCount: 0,
    documentCount: 0,
    knowledgeSourceCount: 0,
    crmLeadCount: 0,
    memoryCount: 0,
    health: {
      database: 'healthy',
      gateway: 'healthy',
      runtime: 'healthy',
      memory: 'healthy',
      knowledge: 'healthy',
      automation: 'healthy',
    },
    userEmail: 'user-pr',
  };
}

describe('OSA Project Runtime', () => {
  beforeEach(() => {
    resetProjectRuntimeStore();
    resetMemoryStore();
  });

  it('creates project runtime entities', () => {
    const runtime = createProjectRuntime({
      title: 'AI Business OS',
      description: 'Core product workspace',
      organizationId: scope.organizationId,
      userId: scope.userId,
      sourceProjectId: 'project-a',
      mission: 'Продвинуть Runtime.',
    });

    assert.equal(runtime.title, 'AI Business OS');
    assert.equal(runtime.sourceProjectId, 'project-a');
    assert.equal(runtime.status, 'active');
  });

  it('sets and resolves active project', () => {
    const runtime = createProjectRuntime({
      id: 'project-a',
      title: 'FAMALL',
      organizationId: scope.organizationId,
      userId: scope.userId,
      sourceProjectId: 'project-a',
    });

    setActiveProject(scope, runtime.id);
    const active = getActiveProject(scope);

    assert.equal(active?.id, 'project-a');
    assert.equal(active?.active, true);
  });

  it('falls back to default workspace when no projects exist', () => {
    const runtime = resolveActiveProject(scope);

    assert.ok(isDefaultWorkspaceId(runtime.id));
    assert.equal(runtime.title, DEFAULT_WORKSPACE_TITLE);
  });

  it('attaches memory to active project and isolates projects', () => {
    createProjectRuntime({
      id: 'project-a',
      title: 'AI Business OS',
      organizationId: scope.organizationId,
      userId: scope.userId,
      sourceProjectId: 'project-a',
    });

    createProjectRuntime({
      id: 'project-b',
      title: 'Telegram',
      organizationId: scope.organizationId,
      userId: scope.userId,
      sourceProjectId: 'project-b',
    });

    setActiveProject(scope, 'project-a');

    captureGatewayMemory({
      task: 'Подключить Memory Injection',
      result: 'Injection готов',
      intent: 'memory_injection',
      routingCategory: 'planning',
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'AI Business OS',
    });

    setActiveProject(scope, 'project-b');

    captureGatewayMemory({
      task: 'Настроить канал',
      result: 'Черновик поста готов',
      intent: 'telegram_setup',
      routingCategory: 'writing',
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'Telegram',
    });

    syncProjectMemoryState(findProjectRuntime('project-a')!);
    syncProjectMemoryState(findProjectRuntime('project-b')!);

    const osRefreshed = findProjectRuntime('project-a')!;
    const telegramRefreshed = findProjectRuntime('project-b')!;

    assert.match(osRefreshed.memorySummary, /Injection/);
    assert.match(telegramRefreshed.memorySummary, /поста/);

  setActiveProject(scope, 'project-b');
  assert.equal(resolveGatewayProjectId(scope), 'project-b');
  });

  it('builds navigator steps for the active project', () => {
    const runtime = createProjectRuntime({
      id: 'project-content',
      title: 'Контент',
      organizationId: scope.organizationId,
      userId: scope.userId,
      sourceProjectId: 'project-content',
    });

    const steps = buildNavigatorStepsForProject(runtime);

    assert.equal(steps.length, 3);
    assert.match(steps[0]?.description ?? '', /Контент/);
    assert.equal(steps[2]?.title, 'Масштабировать');
  });

  it('builds today briefing from runtime and memory', () => {
    const runtime = createProjectRuntime({
      id: 'project-os',
      title: 'AI Business OS',
      organizationId: scope.organizationId,
      userId: scope.userId,
      sourceProjectId: 'project-os',
      nextStep: 'Подключить Project Runtime',
    });

    setActiveProject(scope, runtime.id);

    captureGatewayMemory({
      task: 'Создать Navigator',
      result: 'Navigator UI готов',
      intent: 'navigator',
      routingCategory: 'planning',
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'AI Business OS',
    });

    recordProjectRuntimeFromGateway({
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectRuntimeId: runtime.id,
      task: 'Создать Navigator',
      result: 'Navigator UI готов',
    });

    const refreshed = findProjectRuntime('project-os')!;
    syncProjectMemoryState(refreshed);
    const briefing = buildProjectTodayBriefing(refreshed, emptySnapshot());

    assert.match(briefing.headline, /AI Business OS/);
    assert.equal(briefing.lastResult, 'Navigator UI готов');
    assert.ok(briefing.progressPercent > 0);
    assert.match(briefing.nextStep, /Navigator|Подключить/);
  });

  it('lists project runtimes by scope', () => {
    createProjectRuntime({
      id: 'p1',
      title: 'YouTube',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    createProjectRuntime({
      id: 'p2',
      title: 'Other Org',
      organizationId: 'other-org',
      userId: scope.userId,
    });

    assert.equal(listProjectRuntimes(scope).length, 1);
    assert.equal(listProjectRuntimes(scope)[0]?.title, 'YouTube');
  });

  it('updates project runtime fields', () => {
    const runtime = createProjectRuntime({
      id: 'p-update',
      title: 'Инвестиционная недвижимость',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    const updated = updateProjectRuntime(runtime.id, {
      summary: 'Собран первый план сделок.',
      nextStep: 'Подготовить список объектов.',
      status: 'active',
    });

    assert.equal(updated.summary, 'Собран первый план сделок.');
    assert.equal(updated.nextStep, 'Подготовить список объектов.');
  });
});
