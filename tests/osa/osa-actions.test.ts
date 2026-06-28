import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildOsaAgentTrace,
  buildSimulatedOsaTaskResult,
  mapRuntimeResultToOsaTaskResult,
  validateOsaTaskInput,
} from '@/utils/osa/osa-task';

const SAMPLE_AGENTS = [
  { id: 'business-manager', name: 'AI Business Manager' },
  { id: 'estate', name: 'AI Estate' },
  { id: 'crm', name: 'AI CRM' },
  { id: 'analyst', name: 'AI Analyst' },
];

describe('OSA task submission helpers', () => {
  it('rejects empty prompt', () => {
    const error = validateOsaTaskInput({
      userPrompt: '   ',
      selectedAgents: SAMPLE_AGENTS,
      businessDescription: 'Я инвест-брокер',
    });

    assert.equal(error, 'userPrompt is required');
  });

  it('builds agent trace with Navigator first', () => {
    const trace = buildOsaAgentTrace(SAMPLE_AGENTS);
    assert.deepEqual(trace, ['Navigator', 'AI Estate', 'AI CRM', 'AI Analyst']);
  });

  it('returns simulated result for demo mode', () => {
    const result = buildSimulatedOsaTaskResult(
      {
        userPrompt: 'Подготовь план на неделю',
        selectedAgents: SAMPLE_AGENTS,
        businessDescription: 'Я инвест-брокер',
      },
      'session-001',
    );

    assert.equal(result.status, 'simulated');
    assert.ok(result.resultText?.includes('Execution Graph'));
    assert.equal(result.agentTrace.length, 4);
  });

  it('maps runtime success to completed result', () => {
    const result = mapRuntimeResultToOsaTaskResult(
      {
        userPrompt: 'Задача',
        selectedAgents: SAMPLE_AGENTS,
        businessDescription: 'Бизнес',
      },
      {
        success: true,
        status: 'completed',
        simulated: false,
        result: {
          trace: {
            runId: 'run-001',
            correlationId: 'run-001',
            traceId: 'run-001',
            parentRunId: null,
          },
          status: 'completed',
          output: { content: 'План готов' },
          error: null,
          usage: {
            inputTokens: 10,
            outputTokens: 20,
            toolCallCount: 1,
            gatewayCallCount: 1,
          },
          timeline: [{ stage: 'gateway.completed', startedAt: '', durationMs: 100, status: 'ok' }],
          completedAt: new Date().toISOString(),
        },
        error: null,
        report: {
          runId: 'run-001',
          durationMs: 100,
          toolCallCount: 1,
          gatewayCallCount: 1,
          inputTokens: 10,
          outputTokens: 20,
        },
      },
    );

    assert.equal(result.status, 'completed');
    assert.equal(result.resultText, 'План готов');
    assert.ok(result.runtimeReport);
  });

  it('maps runtime failure to failed result', () => {
    const result = mapRuntimeResultToOsaTaskResult(
      {
        userPrompt: 'Задача',
        selectedAgents: SAMPLE_AGENTS,
        businessDescription: 'Бизнес',
      },
      {
        success: false,
        status: 'failed',
        simulated: false,
        result: null,
        error: { code: 'GatewayError', message: 'Provider unavailable', stage: 'gateway' },
        report: null,
      },
    );

    assert.equal(result.status, 'failed');
    assert.match(result.message, /Provider unavailable/);
  });
});
