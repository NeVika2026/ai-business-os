import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

import {
  archiveMemory,
  captureGatewayMemory,
  createMemory,
  createMemoryStore,
  deleteMemory,
  findMemory,
  findProject,
  getRecentMemory,
  listProjects,
  resetMemoryStore,
  summarizeMemory,
  updateMemory,
} from '@/lib/memory/memory-engine';

describe('OSA Runtime Memory Engine', () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it('creates memory with task, result, intent, routing and summary', () => {
    const store = createMemoryStore();

    const entry = createMemory(
      {
        scope: 'business',
        task: 'Подготовить план поиска клиентов',
        result: '1. Сегмент\n2. Канал\n3. Первый контакт',
        intent: 'login_first_result',
        routingCategory: 'planning',
        organizationId: 'org-1',
        userId: 'user-1',
      },
      store,
    );

    assert.equal(entry.scope, 'business');
    assert.equal(entry.intent, 'login_first_result');
    assert.equal(entry.routingCategory, 'planning');
    assert.ok(entry.summary.includes('→'));
    assert.equal(entry.archived, false);
  });

  it('captures memory after gateway success', () => {
    const entry = captureGatewayMemory({
      task: 'Составить контент-план',
      result: 'Неделя 1: обзор продукта',
      intent: 'osa_content_plan',
      routingCategory: 'writing',
      organizationId: 'org-1',
      userId: 'user-1',
      sessionId: 'session-abc',
      runId: 'run-1',
      correlationId: 'corr-1',
    });

    assert.equal(entry.category, 'gateway_outcome');
    assert.equal(entry.sessionId, 'session-abc');
    assert.equal(entry.runId, 'run-1');
    assert.equal(entry.correlationId, 'corr-1');
  });

  it('finds memory by organization, text and scope', () => {
    const store = createMemoryStore();

    createMemory(
      {
        scope: 'project',
        task: 'Стратегия роста',
        result: 'Фокус на новостройки',
        intent: 'strategy',
        routingCategory: 'business_strategy',
        organizationId: 'org-1',
        projectName: 'Client Growth',
      },
      store,
    );

    createMemory(
      {
        scope: 'business',
        task: 'Анализ конкурентов',
        result: 'Три ключевых игрока',
        intent: 'analysis',
        routingCategory: 'analysis',
        organizationId: 'org-1',
      },
      store,
    );

    const byText = findMemory({ organizationId: 'org-1', text: 'новостройки' }, store);
    assert.equal(byText.length, 1);
    assert.equal(byText[0]?.task, 'Стратегия роста');

    const byScope = findMemory({ organizationId: 'org-1', scope: 'business' }, store);
    assert.equal(byScope.length, 1);
    assert.equal(byScope[0]?.task, 'Анализ конкурентов');
  });

  it('updates active memory entries', () => {
    const store = createMemoryStore();

    const entry = createMemory(
      {
        scope: 'daily',
        task: 'Утренний приоритет',
        result: 'Сфокусироваться на продажах',
        intent: 'daily_focus',
        routingCategory: 'planning',
        organizationId: 'org-1',
      },
      store,
    );

    const updated = updateMemory(
      entry.id,
      {
        summary: 'Приоритет дня: продажи',
        importance: 'high',
      },
      store,
    );

    assert.equal(updated.summary, 'Приоритет дня: продажи');
    assert.equal(updated.importance, 'high');
  });

  it('archives memory without deleting it', () => {
    const store = createMemoryStore();

    const entry = createMemory(
      {
        scope: 'session',
        task: 'Черновик письма',
        result: 'Текст письма клиенту',
        intent: 'draft_email',
        routingCategory: 'writing',
        organizationId: 'org-1',
        sessionId: 'session-1',
      },
      store,
    );

    const archived = archiveMemory(entry.id, store);
    assert.equal(archived.archived, true);

    const active = findMemory({ organizationId: 'org-1' }, store);
    assert.equal(active.length, 0);

    const withArchived = findMemory({ organizationId: 'org-1', includeArchived: true }, store);
    assert.equal(withArchived.length, 1);
  });

  it('deletes memory and detaches it from projects', () => {
    const store = createMemoryStore();

    const entry = createMemory(
      {
        scope: 'project',
        task: 'Запуск рекламы',
        result: 'Бюджет и креативы',
        intent: 'ads_launch',
        routingCategory: 'planning',
        organizationId: 'org-1',
        projectName: 'Marketing Q2',
      },
      store,
    );

    const project = findProject({ name: 'Marketing Q2', organizationId: 'org-1' }, store);
    assert.ok(project);
    assert.ok(project.entryIds.includes(entry.id));

    deleteMemory(entry.id, store);

    assert.equal(findMemory({ organizationId: 'org-1' }, store).length, 0);
    const projectAfterDelete = findProject({ name: 'Marketing Q2', organizationId: 'org-1' }, store);
    assert.equal(projectAfterDelete?.entryIds.length, 0);
  });

  it('summarizes memory for a scope', () => {
    const store = createMemoryStore();

    createMemory(
      {
        scope: 'business',
        task: 'План на неделю',
        result: 'Пять приоритетных задач',
        intent: 'weekly_plan',
        routingCategory: 'planning',
        organizationId: 'org-1',
        occurredAt: '2026-06-30T10:00:00.000Z',
      },
      store,
    );

    createMemory(
      {
        scope: 'business',
        task: 'Обзор воронки',
        result: 'Конверсия выросла на 4%',
        intent: 'funnel_review',
        routingCategory: 'analysis',
        organizationId: 'org-1',
        occurredAt: '2026-06-30T11:00:00.000Z',
      },
      store,
    );

    const summary = summarizeMemory({ scope: 'business', organizationId: 'org-1' }, store);

    assert.equal(summary.entryCount, 2);
    assert.equal(summary.activeEntryCount, 2);
    assert.equal(summary.recentTasks[0], 'Обзор воронки');
    assert.equal(summary.highlights.length, 2);
    assert.equal(summary.lastActivityAt, '2026-06-30T11:00:00.000Z');
  });

  it('supports multiple projects for one organization', () => {
    const store = createMemoryStore();

    createMemory(
      {
        scope: 'project',
        task: 'Найти 10 клиентов',
        result: 'Список каналов',
        intent: 'find_clients',
        routingCategory: 'business_strategy',
        organizationId: 'org-1',
        projectName: 'Client Growth',
      },
      store,
    );

    createMemory(
      {
        scope: 'project',
        task: 'Контент на месяц',
        result: '12 тем для постов',
        intent: 'content_calendar',
        routingCategory: 'writing',
        organizationId: 'org-1',
        projectName: 'Content Engine',
      },
      store,
    );

    const projects = listProjects({ organizationId: 'org-1' }, store);
    assert.equal(projects.length, 2);

    const clientGrowth = findProject({ name: 'Client Growth', organizationId: 'org-1' }, store);
    assert.ok(clientGrowth);
    assert.equal(findMemory({ projectId: clientGrowth.id }, store).length, 1);

    const recent = getRecentMemory({ organizationId: 'org-1', limit: 1 }, store);
    assert.equal(recent.length, 1);
  });
});
