import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import {
  buildCabinetDashboardFromSnapshot,
  classifyActivityCategory,
  createEmptyCabinetDashboard,
  formatExecutionTimeMs,
  formatSuccessRate,
  mapEventsToActivity,
  mapEventsToNotifications,
  mapHealthSnapshot,
  mapRunsToHistory,
  mapRunsToOverviewMetrics,
  mapRunsToUsageStats,
  mapSnapshotToModules,
  mapSnapshotToProfile,
  mapSnapshotToQuickActions,
  mapSnapshotToWorkspace,
  type CabinetRawSnapshot,
} from '@/utils/cabinet/dashboard-mappers';

const now = new Date();
const NOW = now.toISOString();
const WEEK_AGO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
const MONTH_AGO = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

function createRun(
  overrides: Partial<OrchestratorRun> & Pick<OrchestratorRun, 'id' | 'status'>,
): OrchestratorRun {
  return {
    organization_id: 'org-001',
    ai_employee_id: 'agent-001',
    input: { action: 'osa_task', source: 'osa_workspace' },
    output: null,
    error_message: null,
    tokens_input: 0,
    tokens_output: 0,
    started_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    completed_at: now.toISOString(),
    created_at: NOW,
    employee: { id: 'agent-001', name: 'OSA Navigator', role_title: 'Navigator' },
    ...overrides,
  };
}

function createEvent(
  overrides: Partial<OrchestratorEvent> & Pick<OrchestratorEvent, 'id' | 'type'>,
): OrchestratorEvent {
  return {
    organization_id: 'org-001',
    source: 'osa',
    actor_type: 'system',
    actor_id: null,
    payload: {},
    correlation_id: 'run-001',
    created_at: NOW,
    ...overrides,
  };
}

function createSnapshot(overrides: Partial<CabinetRawSnapshot> = {}): CabinetRawSnapshot {
  return {
    runs: [
      createRun({ id: 'run-active', status: 'running', completed_at: null }),
      createRun({ id: 'run-done', status: 'completed' }),
      createRun({ id: 'run-failed', status: 'failed', created_at: WEEK_AGO }),
    ],
    events: [
      createEvent({ id: 'event-osa', type: 'osa_task_submitted' }),
      createEvent({ id: 'event-auto', type: 'run_completed', source: 'orchestrator' }),
      createEvent({ id: 'event-doc', type: 'knowledge_source_created', source: 'knowledge' }),
      createEvent({ id: 'event-noise', type: 'osa_progress_updated' }),
    ],
    organization: {
      id: 'org-001',
      name: 'Acme AI',
      settings: { subscription: 'Pro' },
      created_at: MONTH_AGO,
    },
    projects: [
      {
        id: 'project-001',
        name: 'Launch Plan',
        status: 'active',
        project_type: 'general',
        created_at: MONTH_AGO,
        updated_at: NOW,
      },
    ],
    projectCount: 3,
    workspaceCount: 3,
    agentCount: 4,
    documentCount: 12,
    knowledgeSourceCount: 5,
    crmLeadCount: 8,
    memoryCount: 2,
    health: {
      database: 'healthy',
      gateway: 'warning',
      runtime: 'healthy',
      memory: 'unknown',
      knowledge: 'healthy',
      automation: 'healthy',
    },
    userEmail: 'owner@example.com',
    ...overrides,
  };
}

describe('Cabinet dashboard loader mappers', () => {
  it('maps overview metrics from agent runs', () => {
    const metrics = mapRunsToOverviewMetrics(createSnapshot().runs);

    assert.equal(metrics.activeExecutions, 1);
    assert.equal(metrics.completedExecutions, 1);
    assert.equal(metrics.failedExecutions, 1);
    assert.equal(metrics.totalAiRuns, 3);
    assert.ok(metrics.executionTimeTodayMs >= 0);
  });

  it('maps activity categories for OSA, projects, documents, and automation', () => {
    const events = [
      createEvent({ id: '1', type: 'osa_task_submitted', source: 'osa' }),
      createEvent({ id: '2', type: 'project_created', source: 'projects' }),
      createEvent({ id: '3', type: 'knowledge_source_created', source: 'knowledge' }),
      createEvent({ id: '4', type: 'run_completed', source: 'orchestrator' }),
    ];

    assert.equal(classifyActivityCategory(events[0]!), 'osa');
    assert.equal(classifyActivityCategory(events[1]!), 'projects');
    assert.equal(classifyActivityCategory(events[2]!), 'documents');
    assert.equal(classifyActivityCategory(events[3]!), 'automation');

    const activity = mapEventsToActivity(events);

    assert.equal(activity.length, 4);
    assert.equal(activity[0]?.category, 'osa');
  });

  it('filters progress noise and limits activity to 15 items', () => {
    const events = Array.from({ length: 20 }, (_, index) =>
      createEvent({
        id: `event-${index}`,
        type: index % 2 === 0 ? 'osa_task_submitted' : 'osa_progress_updated',
      }),
    );

    const activity = mapEventsToActivity(events);

    assert.equal(activity.length, 10);
    assert.ok(activity.every((item) => item.title.length > 0));
  });

  it('maps usage stats with averages and success rate', () => {
    const usage = mapRunsToUsageStats(createSnapshot().runs);

    assert.ok(usage.todayRuns >= 1);
    assert.ok(usage.weekRuns >= 2);
    assert.ok(usage.monthRuns >= 3);
    assert.ok(usage.averageRuntimeMs !== null);
    assert.ok(usage.successRate !== null);
  });

  it('maps profile summary with organization and counts', () => {
    const profile = mapSnapshotToProfile(createSnapshot());

    assert.equal(profile.email, 'owner@example.com');
    assert.equal(profile.organizationName, 'Acme AI');
    assert.equal(profile.subscription, 'Pro');
    assert.equal(profile.projectCount, 3);
    assert.equal(profile.agentCount, 4);
    assert.equal(profile.executionCount, 3);
    assert.equal(profile.createdAt, MONTH_AGO);
  });

  it('maps quick action counts from snapshot data', () => {
    const actions = mapSnapshotToQuickActions(createSnapshot());
    const byId = Object.fromEntries(actions.map((action) => [action.id, action.count]));

    assert.equal(byId.new_project, 3);
    assert.equal(byId.create_ai_team, 4);
    assert.equal(byId.import_documents, 12);
    assert.equal(byId.connect_crm, 8);
  });

  it('maps module counters for platform modules', () => {
    const modules = mapSnapshotToModules(createSnapshot());
    const byId = Object.fromEntries(modules.map((module) => [module.id, module.count]));

    assert.equal(byId.osa, 3);
    assert.equal(byId.projects, 3);
    assert.equal(byId.documents, 12);
    assert.equal(byId.knowledge, 5);
    assert.equal(byId.crm, 8);
  });

  it('maps health snapshot with unknown status support', () => {
    const health = mapHealthSnapshot(createSnapshot().health);
    const memory = health.find((item) => item.id === 'memory');
    const gateway = health.find((item) => item.id === 'gateway');

    assert.equal(memory?.status, 'unknown');
    assert.equal(gateway?.status, 'warning');
  });

  it('maps workspace card from latest project and run', () => {
    const workspace = mapSnapshotToWorkspace(createSnapshot());

    assert.equal(workspace.name, 'Acme AI');
    assert.equal(workspace.currentProject, 'Launch Plan');
    assert.ok(workspace.lastExecution);
    assert.equal(workspace.status, 'Active execution');
  });

  it('maps unread notifications and execution history', () => {
    const snapshot = createSnapshot();
    const notifications = mapEventsToNotifications([
      ...snapshot.events,
      createEvent({ id: 'read-event', type: 'run_completed', metadata: { read: true } }),
    ]);
    const history = mapRunsToHistory(snapshot.runs);

    assert.equal(notifications.length, 3);
    assert.equal(history.length, 3);
    assert.equal(history[0]?.href, '/orchestrator/runs/run-active');
  });

  it('builds full dashboard from snapshot', () => {
    const dashboard = buildCabinetDashboardFromSnapshot(createSnapshot());

    assert.equal(dashboard.overview.totalAiRuns, 3);
    assert.equal(dashboard.activity.length, 3);
    assert.equal(dashboard.modules.length, 10);
    assert.equal(dashboard.notifications.length, 3);
  });

  it('returns empty dashboard for empty state', () => {
    const dashboard = createEmptyCabinetDashboard('empty@example.com');

    assert.equal(dashboard.profile.email, 'empty@example.com');
    assert.equal(dashboard.overview.totalAiRuns, 0);
    assert.equal(dashboard.activity.length, 0);
    assert.equal(dashboard.notifications.length, 0);
    assert.equal(dashboard.health[0]?.status, 'unknown');
  });

  it('formats execution time helper values', () => {
    assert.equal(formatExecutionTimeMs(0), '0s');
    assert.equal(formatExecutionTimeMs(65000), '1m 5s');
    assert.equal(formatSuccessRate(null), '—');
  });
});
