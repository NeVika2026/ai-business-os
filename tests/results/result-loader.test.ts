import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import { buildFindClientsFallbackDeliverable } from '@/utils/results/find-clients-deliverable';
import {
  buildResultHref,
  mapResultArtifacts,
  mapResultStatus,
  mapResultTimeline,
  mapRunToResult,
  resolveHistoryResultContext,
  resolveHistoryResultLabel,
  resolveResultTitle,
} from '@/utils/results/result-mappers';

const NOW = '2026-06-28T12:00:00.000Z';
const STARTED = '2026-06-28T12:01:00.000Z';
const COMPLETED = '2026-06-28T12:05:00.000Z';

function createRun(
  overrides: Partial<OrchestratorRun> & Pick<OrchestratorRun, 'id' | 'status'>,
): OrchestratorRun {
  return {
    organization_id: 'org-001',
    ai_employee_id: 'employee-001',
    input: {
      action: 'osa_task',
      source: 'osa_workspace',
      user_prompt: 'Launch a summer marketing campaign',
      project_id: 'project-001',
    },
    output: {
      resultText: 'Campaign plan with audience, channels, and weekly milestones.',
    },
    error_message: null,
    tokens_input: 100,
    tokens_output: 250,
    started_at: STARTED,
    completed_at: COMPLETED,
    created_at: NOW,
    employee: { id: 'employee-001', name: 'Internal', role_title: 'Internal' },
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

describe('result mappers', () => {
  it('builds result hrefs under /results', () => {
    assert.equal(buildResultHref('run-001'), '/results/run-001');
  });

  it('maps statuses to human labels', () => {
    assert.equal(mapResultStatus('completed'), 'Completed');
    assert.equal(mapResultStatus('running'), 'In progress');
    assert.equal(mapResultStatus('pending'), 'Preparing');
    assert.equal(mapResultStatus('failed'), 'Needs attention');
  });

  it('resolves titles and history labels from user prompts', () => {
    const run = createRun({ id: 'run-001', status: 'completed' });

    assert.equal(resolveResultTitle(run), 'Launch a summer marketing campaign');
    assert.equal(resolveHistoryResultLabel(run), 'Launch a summer marketing campaign');
    assert.equal(resolveHistoryResultContext(run), 'Business task');
  });

  it('maps a completed run into result data', () => {
    const run = createRun({ id: 'run-001', status: 'completed' });
    const events = [
      createEvent({ id: 'event-1', type: 'osa_task_submitted', created_at: NOW }),
      createEvent({ id: 'event-2', type: 'osa_runtime_started', created_at: STARTED }),
      createEvent({ id: 'event-3', type: 'run_completed', created_at: COMPLETED }),
    ];
    const result = mapRunToResult(run, events, 'Summer Launch');

    assert.equal(result.id, 'run-001');
    assert.equal(result.status, 'Completed');
    assert.equal(result.projectName, 'Summer Launch');
    assert.equal(result.projectHref, '/projects/project-001');
    assert.equal(result.summary.requested, 'Launch a summer marketing campaign');
    assert.match(result.summary.completed, /Campaign plan/);
    assert.equal(result.nextSteps[0]?.label, 'Continue working');
    assert.equal(result.actions[0]?.label, 'Continue');
    assert.equal(result.timeline[0]?.label, 'Requested');
    assert.equal(result.timeline.at(-1)?.label, 'Completed');
    assert.equal(result.presentationHeadline, "Here's what I prepared for you.");
    assert.equal(result.celebration.show, true);
    assert.equal(result.experience.enabled, false);
  });

  it('maps find_clients into the structured result experience', () => {
    const run = createRun({
      id: 'run-fc',
      status: 'completed',
      input: {
        action: 'osa_task',
        source: 'osa_workspace',
        user_prompt: 'Find clients for my design studio',
        goal_id: 'find_clients',
        goal_title: 'Find Clients',
        project_id: 'project-001',
      },
      output: {
        result_text: buildFindClientsFallbackDeliverable(
          'Find clients for my design studio',
          'Brand design for startups',
        ),
        key_outcome: 'Reach startup founders on LinkedIn this week.',
        goal_id: 'find_clients',
      },
    });
    const result = mapRunToResult(run, [], 'Client Growth', 1);

    assert.equal(result.experience.enabled, true);
    assert.equal(result.presentationHeadline, 'Reach startup founders on LinkedIn this week.');
    assert.equal(result.experience.primaryAction.label, 'Send your first outreach today');
    assert.match(result.experience.primaryAction.href, /#outreach-draft$/);
    assert.equal(result.experience.secondaryAction.label, 'Continue tomorrow');
    assert.equal(result.celebration.headline, 'Your client acquisition plan is ready.');
    assert.ok(result.experience.deliverableSections.length >= 3);
    assert.equal(result.artifacts.length, 0);
    assert.equal(result.actions.length, 0);
  });

  it('shows payment placeholder after the third completed result', () => {
    const run = createRun({
      id: 'run-pay',
      status: 'completed',
      input: {
        action: 'osa_task',
        source: 'osa_workspace',
        user_prompt: 'Find clients',
        goal_id: 'find_clients',
        goal_title: 'Find Clients',
        project_id: 'project-001',
      },
      output: {
        result_text: buildFindClientsFallbackDeliverable('Find clients', 'Consulting'),
        goal_id: 'find_clients',
      },
    });
    const result = mapRunToResult(run, [], 'Client Growth', 3);

    assert.equal(result.experience.paymentPlaceholder.show, true);
  });

  it('maps timeline fallbacks when events are missing', () => {
    const run = createRun({ id: 'run-002', status: 'running', completed_at: null });
    const timeline = mapResultTimeline(run, []);

    assert.deepEqual(
      timeline.map((entry) => entry.label),
      ['Requested', 'Started', 'Working'],
    );
  });

  it('maps artifacts from completed output', () => {
    const run = createRun({ id: 'run-003', status: 'completed' });
    const artifacts = mapResultArtifacts(run);

    assert.equal(artifacts.length, 1);
    assert.equal(artifacts[0]?.kind, 'output');
    assert.match(artifacts[0]?.description ?? '', /Campaign plan/);
  });
});
