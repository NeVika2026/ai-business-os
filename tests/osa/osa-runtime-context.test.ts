import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildExecutionPlan, formatExecutionPlanEta } from '@/utils/osa/execution-planner';
import {
  buildOsaRuntimeInput,
  buildOsaRuntimePromptContext,
  formatExecutionPlanForRuntime,
  resolveOsaRuntimePromptContext,
} from '@/utils/osa/osa-runtime-context';
import { prepareOsaTaskSubmitInput } from '@/utils/osa/osa-task';
import { getOsaTeamRecommendation } from '@/utils/osa/team-recommendation';

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

describe('OSA runtime context', () => {
  it('formats execution plan for runtime with stages, dependencies, ETA, and risks', () => {
    const prepared = prepareOsaTaskSubmitInput(SAMPLE_INPUT);
    const formatted = formatExecutionPlanForRuntime(prepared.executionPlan);

    assert.match(formatted, /=== OSA EXECUTION PLAN ===/);
    assert.match(formatted, /--- Stages ---/);
    assert.match(formatted, /Stage 1: discovery/);
    assert.match(formatted, /Assigned agents:/);
    assert.match(formatted, /--- Dependencies ---/);
    assert.match(
      formatted,
      new RegExp(`ETA: ${formatExecutionPlanEta(prepared.executionPlan.estimatedMinutes)}`),
    );
    assert.match(formatted, /Review required:/);
    assert.match(formatted, /--- Risks ---/);
  });

  it('includes selected agents and risks in prompt context', () => {
    const urgentInput = {
      ...SAMPLE_INPUT,
      userPrompt: 'Срочно нужен сложный enterprise-план интеграции CRM',
    };
    const context = buildOsaRuntimePromptContext(prepareOsaTaskSubmitInput(urgentInput));

    assert.equal(context.taskGoal, urgentInput.userPrompt);
    assert.equal(context.businessDescription, SAMPLE_INPUT.businessDescription);
    assert.deepEqual(context.selectedAgents, SAMPLE_AGENTS);
    assert.ok(context.agentTrace.includes('Navigator'));
    assert.ok(context.executionPlanText.includes('Assigned agents:'));
    assert.ok(context.executionPlanText.includes('[medium]'));
    assert.ok(context.reviewRequired === false || context.reviewRequired === true);
  });

  it('builds runtime input with businessDescription, userPrompt, and plan summary', () => {
    const runtimeInput = buildOsaRuntimeInput(SAMPLE_INPUT, { sessionId: 'session-001' });

    assert.equal(runtimeInput.userPrompt, SAMPLE_INPUT.userPrompt);
    assert.equal(runtimeInput.businessDescription, SAMPLE_INPUT.businessDescription);
    assert.equal(runtimeInput.taskGoal, SAMPLE_INPUT.userPrompt);
    assert.equal(runtimeInput.sessionId, 'session-001');
    assert.equal(runtimeInput.source, 'osa_workspace');
    assert.ok(typeof runtimeInput.executionPlanSummary === 'string');
    assert.ok(String(runtimeInput.executionPlanSummary).includes('ETA'));
    assert.ok(typeof runtimeInput.executionPlanText === 'string');
    assert.ok(Array.isArray((runtimeInput.selectedAgents as unknown[] | undefined) ?? []));
    assert.ok(runtimeInput.executionPlan);
    assert.ok(runtimeInput.executionGraph);
    assert.ok(typeof runtimeInput.executionGraphSummary === 'string');
    assert.ok(runtimeInput.osaRuntimeContext);
  });

  it('falls back safely when execution plan is missing from submit input', () => {
    const context = resolveOsaRuntimePromptContext(SAMPLE_INPUT);
    const runtimeInput = buildOsaRuntimeInput(SAMPLE_INPUT, { sessionId: 'session-fallback' });

    assert.equal(context.executionPlanText.length > 0, true);
    assert.equal(runtimeInput.executionPlanSummary, context.executionPlanSummary);
    assert.match(String(runtimeInput.executionPlanText), /Stage 1: discovery/);
  });

  it('is deterministic for the same prepared input', () => {
    const team = getOsaTeamRecommendation('Я инвест-брокер и хочу больше клиентов').team;
    const plan = buildExecutionPlan({
      userInput: 'Я инвест-брокер и хочу больше клиентов',
      team,
    });
    const prepared = prepareOsaTaskSubmitInput({
      ...SAMPLE_INPUT,
      executionPlan: plan,
    });

    const first = formatExecutionPlanForRuntime(prepared.executionPlan);
    const second = formatExecutionPlanForRuntime(prepared.executionPlan);

    assert.equal(first, second);
  });
});
