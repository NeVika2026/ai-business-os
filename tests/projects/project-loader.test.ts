import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import {
  buildProjectListData,
  buildProjectWorkspaceFromSnapshot,
  classifyProjectActivityCategory,
  computeProjectProgress,
  countEnabledModules,
  createEmptyProjectList,
  extractProjectGoals,
  filterProjectOsaRuns,
  filterProjectRuns,
  mapEventsToProjectActivity,
  mapProjectRow,
  mapRunsToExecutions,
  mapSnapshotToModules,
  mapSnapshotToTimeline,
  slugifyProjectName,
} from '@/utils/projects/project-mappers';
import type { ProjectRawSnapshot } from '@/utils/projects/project-types';

const now = new Date();
const NOW = now.toISOString();

function createRun(
  overrides: Partial<OrchestratorRun> & Pick<OrchestratorRun, 'id' | 'status'>,
): OrchestratorRun {
  return {
    organization_id: 'org-001',
    ai_employee_id: 'agent-001',
    input: { action: 'osa_task', source: 'osa_workspace', user_prompt: 'Launch campaign' },
    output: null,
    error_message: null,
    tokens_input: 0,
    tokens_output: 0,
    started_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    completed_at: NOW,
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

function createSnapshot(overrides: Partial<ProjectRawSnapshot> = {}): ProjectRawSnapshot {
  return {
    project: {
      id: 'project-001',
      organization_id: 'org-001',
      name: 'Marketing Launch',
      description: '- Launch campaign\n- Connect CRM',
      project_type: 'marketing',
      status: 'active',
      icon: '📣',
      color: '#6366f1',
      created_by: 'user-001',
      updated_by: null,
      created_at: NOW,
      updated_at: NOW,
    },
    employeeIds: ['agent-001'],
    taskIds: ['task-001'],
    runs: [
      createRun({ id: 'run-001', status: 'completed' }),
      createRun({ id: 'run-002', status: 'failed', ai_employee_id: 'agent-other' }),
    ],
    events: [
      createEvent({ id: 'event-001', type: 'osa_task_submitted', correlation_id: 'run-001' }),
      createEvent({ id: 'event-002', type: 'knowledge_source_created', source: 'knowledge' }),
      createEvent({ id: 'event-noise', type: 'osa_progress_updated' }),
    ],
    knowledgeSources: [
      {
        id: 'source-001',
        name: 'Brand docs',
        source_type: 'upload',
        status: 'ready',
        project_id: 'project-001',
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    knowledgeItems: [
      {
        id: 'item-001',
        title: 'Brief.pdf',
        item_type: 'document',
        status: 'ready',
        project_id: 'project-001',
        source_id: 'source-001',
        created_at: NOW,
      },
    ],
    crmLeadCount: 3,
    memoryCount: 2,
    agentCount: 1,
    members: [
      {
        user_id: 'user-001',
        role: 'owner',
        profile: { full_name: 'Alex Owner' },
      },
    ],
    ...overrides,
  };
}

describe('project loader and mappers', () => {
  it('maps project row with slug and goals', () => {
    const project = mapProjectRow(createSnapshot().project);

    assert.equal(project.slug, slugifyProjectName('Marketing Launch'));
    assert.equal(project.type, 'marketing');
    assert.equal(project.status, 'active');
    assert.deepEqual(extractProjectGoals(createSnapshot().project.description), [
      'Launch campaign',
      'Connect CRM',
    ]);
  });

  it('filters project runs and osa runs', () => {
    const snapshot = createSnapshot();
    const projectRuns = filterProjectRuns(
      snapshot.runs,
      snapshot.project.id,
      snapshot.employeeIds,
      snapshot.taskIds,
    );
    const osaRuns = filterProjectOsaRuns(
      snapshot.runs,
      snapshot.project.id,
      snapshot.employeeIds,
      snapshot.taskIds,
    );

    assert.equal(projectRuns.length, 1);
    assert.equal(osaRuns.length, 1);
    assert.equal(computeProjectProgress(projectRuns), 100);
  });

  it('maps activity and executions', () => {
    const snapshot = createSnapshot();
    const runIds = new Set(snapshot.runs.map((run) => run.id));
    const activity = mapEventsToProjectActivity(snapshot.events, runIds);

    assert.equal(activity.length, 2);
    assert.equal(classifyProjectActivityCategory(snapshot.events[0]!), 'Work');

    const executions = mapRunsToExecutions(
      filterProjectOsaRuns(
        snapshot.runs,
        snapshot.project.id,
        snapshot.employeeIds,
        snapshot.taskIds,
      ),
    );

    assert.equal(executions.length, 1);
    assert.equal(executions[0]?.label, 'Launch campaign');
  });

  it('builds workspace overview, modules, and timeline', () => {
    const workspace = buildProjectWorkspaceFromSnapshot(createSnapshot());

    assert.equal(workspace.project.name, 'Marketing Launch');
    assert.equal(workspace.overview.progressPercent, 100);
    assert.equal(workspace.goals.length, 2);
    assert.equal(workspace.executions.length, 1);
    assert.equal(workspace.documents.length, 1);
    assert.equal(workspace.knowledge.documentCount, 1);
    assert.ok(workspace.modules.some((module) => module.id === 'osa' && module.enabled));
    assert.ok(workspace.timeline.some((entry) => entry.kind === 'project'));
    assert.equal(workspace.quickActions.length, 5);
    assert.equal(workspace.members[0]?.name, 'Alex Owner');
  });

  it('maps module counters and enabled state', () => {
    const snapshot = createSnapshot();
    const projectRuns = filterProjectRuns(
      snapshot.runs,
      snapshot.project.id,
      snapshot.employeeIds,
      snapshot.taskIds,
    );
    const modules = mapSnapshotToModules(snapshot, projectRuns);

    assert.equal(countEnabledModules(modules) >= 4, true);
    assert.equal(modules.find((module) => module.id === 'crm')?.count, 3);
    assert.equal(modules.find((module) => module.id === 'marketing')?.enabled, true);
  });

  it('builds timeline with execution and document entries', () => {
    const snapshot = createSnapshot();
    const projectRuns = filterProjectRuns(
      snapshot.runs,
      snapshot.project.id,
      snapshot.employeeIds,
      snapshot.taskIds,
    );
    const timeline = mapSnapshotToTimeline(snapshot, projectRuns);

    assert.ok(timeline.some((entry) => entry.kind === 'execution'));
    assert.ok(timeline.some((entry) => entry.kind === 'document'));
    assert.ok(timeline.some((entry) => entry.kind === 'knowledge'));
  });

  it('builds project list data and empty state', () => {
    const list = buildProjectListData(
      [createSnapshot().project],
      { 'project-001': 4 },
      { 'project-001': 2 },
    );

    assert.equal(list.totalCount, 1);
    assert.equal(list.projects[0]?.executionCount, 4);
    assert.equal(list.projects[0]?.documentCount, 2);

    const empty = createEmptyProjectList();
    assert.equal(empty.projects.length, 0);
    assert.equal(empty.totalCount, 0);
  });
});
