import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildOsaRunInputPayload,
  buildOsaRunInsertRecord,
  buildOsaRunUpdateForRuntimeFailure,
  buildOsaRunUpdateForRuntimeSuccess,
  buildOsaRunUpdateForSimulated,
  buildOsaRuntimeCompletedEvent,
  buildOsaRuntimeFailedEvent,
  buildOsaRuntimeStartedEvent,
  buildOsaTaskSubmittedEvent,
  buildOsaTeamSelectedEvent,
  buildPersistedSimulatedOsaTaskResult,
  attachRunIdToOsaTaskResult,
} from '@/utils/osa/osa-run-persistence';

const SAMPLE_AGENTS = [
  { id: 'business-manager', name: 'AI Business Manager' },
  { id: 'estate', name: 'AI Estate' },
  { id: 'crm', name: 'AI CRM' },
  { id: 'analyst', name: 'AI Analyst' },
];

const SAMPLE_INPUT = {
  userPrompt: 'Подготовь план на неделю',
  selectedAgents: SAMPLE_AGENTS,
  businessDescription: 'Я инвест-брокер',
};

const BASE_CONTEXT = {
  runId: 'run-osa-001',
  sessionId: 'session-001',
  organizationId: '11111111-1111-1111-1111-111111111111',
  aiEmployeeId: 'osa000001-0000-4000-8000-000000000001',
  userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  runtimeBridgeEnabled: false,
};

describe('OSA run persistence mapping', () => {
  it('builds agent_run input with OSA metadata', () => {
    const inputPayload = buildOsaRunInputPayload(SAMPLE_INPUT, BASE_CONTEXT);

    assert.equal(inputPayload.action, 'osa_task');
    assert.equal(inputPayload.source, 'osa_workspace');
    assert.equal(inputPayload.session_id, 'session-001');
    assert.equal(inputPayload.simulated, true);
    assert.equal(inputPayload.runtime_bridge_enabled, false);
    assert.deepEqual(inputPayload.agent_trace, ['Navigator', 'AI Estate', 'AI CRM', 'AI Analyst']);
  });

  it('builds running agent_run insert record', () => {
    const record = buildOsaRunInsertRecord(SAMPLE_INPUT, BASE_CONTEXT);

    assert.equal(record.organization_id, BASE_CONTEXT.organizationId);
    assert.equal(record.ai_employee_id, BASE_CONTEXT.aiEmployeeId);
    assert.equal(record.status, 'running');
    assert.equal(record.created_by, BASE_CONTEXT.userId);
    assert.equal(record.input.action, 'osa_task');
  });

  it('builds simulated completion update', () => {
    const update = buildOsaRunUpdateForSimulated(SAMPLE_INPUT, BASE_CONTEXT);

    assert.equal(update.status, 'completed');
    assert.equal(update.output.simulated, true);
    assert.equal(update.output.status, 'simulated');
    assert.deepEqual(update.output.agent_trace, ['Navigator', 'AI Estate', 'AI CRM', 'AI Analyst']);
  });

  it('builds runtime success and failure updates', () => {
    const success = buildOsaRunUpdateForRuntimeSuccess(
      {
        success: true,
        status: 'completed',
        simulated: false,
        result: {
          trace: {
            runId: 'run-osa-001',
            correlationId: 'run-osa-001',
            traceId: 'run-osa-001',
            parentRunId: null,
          },
          status: 'completed',
          output: { content: 'Готово' },
          error: null,
          usage: {
            inputTokens: 12,
            outputTokens: 34,
            toolCallCount: 1,
            gatewayCallCount: 1,
          },
          timeline: [],
          completedAt: new Date().toISOString(),
        },
        error: null,
        report: {
          runId: 'run-osa-001',
          durationMs: 120,
          toolCallCount: 1,
          gatewayCallCount: 1,
          inputTokens: 12,
          outputTokens: 34,
        },
      },
      SAMPLE_INPUT,
      { ...BASE_CONTEXT, runtimeBridgeEnabled: true },
    );

    assert.equal(success.status, 'completed');
    assert.equal(success.tokens_input, 12);
    assert.equal(success.output.result_text, 'Готово');

    const failure = buildOsaRunUpdateForRuntimeFailure(
      {
        success: false,
        status: 'failed',
        simulated: false,
        result: null,
        error: { code: 'GatewayError', message: 'Provider unavailable', stage: 'gateway' },
        report: null,
      },
      SAMPLE_INPUT,
      { ...BASE_CONTEXT, runtimeBridgeEnabled: true },
    );

    assert.equal(failure.status, 'failed');
    assert.equal(failure.error_message, 'Provider unavailable');
  });

  it('builds OSA lifecycle events with osa source', () => {
    const submitted = buildOsaTaskSubmittedEvent(BASE_CONTEXT);
    const teamSelected = buildOsaTeamSelectedEvent(BASE_CONTEXT, SAMPLE_AGENTS);
    const started = buildOsaRuntimeStartedEvent(BASE_CONTEXT);
    const completed = buildOsaRuntimeCompletedEvent(BASE_CONTEXT, { status: 'simulated' });
    const failed = buildOsaRuntimeFailedEvent(BASE_CONTEXT, { error: 'boom' });

    assert.equal(submitted.source, 'osa');
    assert.equal(submitted.type, 'osa_task_submitted');
    assert.equal(teamSelected.type, 'osa_team_selected');
    assert.equal(started.type, 'osa_runtime_started');
    assert.equal(completed.type, 'osa_runtime_completed');
    assert.equal(failed.type, 'osa_runtime_failed');
    assert.equal(submitted.correlation_id, 'run-osa-001');
    assert.equal(submitted.payload.run_id, 'run-osa-001');
    assert.deepEqual(teamSelected.payload.agent_trace, [
      'Navigator',
      'AI Estate',
      'AI CRM',
      'AI Analyst',
    ]);
  });

  it('attaches persisted run id to submit result', () => {
    const result = buildPersistedSimulatedOsaTaskResult(SAMPLE_INPUT, 'session-001', 'run-osa-001');

    assert.equal(result.status, 'simulated');
    assert.equal(result.runtimeReport?.runId, 'run-osa-001');

    const attached = attachRunIdToOsaTaskResult(
      {
        status: 'completed',
        message: 'ok',
        resultText: 'done',
        agentTrace: ['Navigator'],
        runtimeReport: {
          runId: 'old',
          durationMs: 10,
          toolCallCount: 0,
          gatewayCallCount: 1,
          inputTokens: 1,
          outputTokens: 2,
        },
      },
      'run-osa-002',
    );

    assert.equal(attached.runtimeReport?.runId, 'run-osa-002');
  });
});
