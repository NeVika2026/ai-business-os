import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildExecutionPlan,
  formatExecutionPlanEta,
  isValidExecutionPlan,
  resolveExecutionPlanForTask,
  type ExecutionPlan,
} from '@/utils/osa/execution-planner';
import { buildNavigatorRecommendation } from '@/utils/osa/navigator-engine';
import { getOsaTeamRecommendation } from '@/utils/osa/team-recommendation';

function buildSampleTeam() {
  return getOsaTeamRecommendation('Я инвест-брокер и хочу больше клиентов по новостройкам').team;
}

describe('OSA execution planner', () => {
  it('builds a three-stage execution plan with required fields', () => {
    const team = buildSampleTeam();
    const recommendation = buildNavigatorRecommendation(
      'Я инвест-брокер и хочу больше клиентов по новостройкам',
    );
    const plan = buildExecutionPlan({
      userInput: 'Я инвест-брокер и хочу больше клиентов по новостройкам',
      team,
      recommendation,
    });

    assert.equal(plan.stages.length, 3);
    assert.equal(plan.stages[0]?.id, 'discovery');
    assert.equal(plan.stages[1]?.id, 'execution');
    assert.equal(plan.stages[2]?.id, 'review');

    for (const stage of plan.stages) {
      assert.ok(stage.title);
      assert.ok(stage.description);
      assert.ok(Array.isArray(stage.assignedAgents));
      assert.ok(stage.estimatedMinutes > 0);
      assert.ok(Array.isArray(stage.dependsOn));
      assert.ok(['pending', 'ready', 'running', 'completed'].includes(stage.status));
    }

    assert.deepEqual(plan.dependencies.discovery, []);
    assert.deepEqual(plan.dependencies.execution, ['discovery']);
    assert.deepEqual(plan.dependencies.review, ['execution']);
    assert.ok(plan.estimatedMinutes > 0);
    assert.ok(['sequential', 'hybrid', 'parallel'].includes(plan.executionMode));
    assert.ok(Array.isArray(plan.risks));
    assert.ok(typeof plan.reviewRequired === 'boolean');
  });

  it('assigns execution stage agents from the selected team', () => {
    const team = buildSampleTeam();
    const plan = buildExecutionPlan({
      userInput: 'Я инвест-брокер и хочу больше клиентов по новостройкам',
      team,
    });

    const executionStage = plan.stages.find((stage) => stage.id === 'execution');
    assert.ok(executionStage);
    assert.ok(executionStage.assignedAgents.length > 0);
    assert.ok(
      executionStage.assignedAgents.every((agent) => team.some((member) => member.id === agent.id)),
    );
    assert.ok(!executionStage.assignedAgents.some((agent) => agent.id === 'business-manager'));
  });

  it('builds parallel groups for multi-agent execution stage', () => {
    const team = buildSampleTeam();
    const plan = buildExecutionPlan({
      userInput: 'Я инвест-брокер и хочу больше клиентов по новостройкам',
      team,
    });

    const executionStage = plan.stages.find((stage) => stage.id === 'execution');
    assert.ok(executionStage);

    if (executionStage.assignedAgents.length > 1) {
      assert.ok(plan.parallelGroups.length > 0);
      assert.equal(plan.executionMode, 'parallel');
      assert.ok(executionStage.parallel);
    }
  });

  it('detects urgency and complexity risks', () => {
    const team = buildSampleTeam();
    const urgentPlan = buildExecutionPlan({
      userInput: 'Срочно нужен сложный enterprise-план интеграции CRM',
      team,
    });

    assert.ok(urgentPlan.risks.some((risk) => risk.id === 'urgency'));
    assert.ok(urgentPlan.risks.some((risk) => risk.id === 'complexity'));
  });

  it('requires review when navigator confidence is low', () => {
    const team = buildSampleTeam();
    const recommendation = buildNavigatorRecommendation('Нужно что-то сделать');
    const plan = buildExecutionPlan({
      userInput: 'Нужно что-то сделать',
      team,
      recommendation,
    });

    assert.ok(plan.reviewRequired);
    assert.ok(plan.risks.some((risk) => risk.id === 'low-confidence'));
  });

  it('calculates ETA along the critical path', () => {
    const team = buildSampleTeam();
    const plan = buildExecutionPlan({
      userInput: 'Я инвест-брокер и хочу больше клиентов по новостройкам',
      team,
    });

    const stageTotal = plan.stages.reduce((sum, stage) => sum + stage.estimatedMinutes, 0);
    assert.ok(plan.estimatedMinutes <= stageTotal);
    assert.ok(plan.estimatedMinutes >= plan.stages[0]?.estimatedMinutes ?? 0);
  });

  it('formats ETA for display', () => {
    assert.equal(formatExecutionPlanEta(45), '45 мин');
    assert.equal(formatExecutionPlanEta(60), '1 ч');
    assert.equal(formatExecutionPlanEta(75), '1 ч 15 мин');
  });

  it('is deterministic for the same input', () => {
    const team = buildSampleTeam();
    const input = {
      userInput: 'Я инвест-брокер и хочу больше клиентов по новостройкам',
      team,
      recommendation: buildNavigatorRecommendation(
        'Я инвест-брокер и хочу больше клиентов по новостройкам',
      ),
    };

    const first = buildExecutionPlan(input);
    const second = buildExecutionPlan(input);

    assert.deepEqual(
      first.stages.map((stage) => stage.id),
      second.stages.map((stage) => stage.id),
    );
    assert.equal(first.estimatedMinutes, second.estimatedMinutes);
    assert.deepEqual(
      first.risks.map((risk) => risk.id),
      second.risks.map((risk) => risk.id),
    );
  });

  it('handles minimal team input safely', () => {
    const team = [buildSampleTeam()[0]!];
    const plan: ExecutionPlan = buildExecutionPlan({
      userInput: 'Короткий запрос',
      team,
    });

    assert.equal(plan.stages.length, 3);
    assert.ok(plan.stages[1]?.assignedAgents.length >= 1);
    assert.ok(plan.risks.some((risk) => risk.id === 'data-quality'));
  });

  it('rejects invalid execution plans and rebuilds from task input', () => {
    const team = buildSampleTeam();
    const validPlan = buildExecutionPlan({
      userInput: 'Я инвест-брокер и хочу больше клиентов по новостройкам',
      team,
    });

    assert.equal(isValidExecutionPlan(validPlan), true);
    assert.equal(isValidExecutionPlan(null), false);
    assert.equal(isValidExecutionPlan({ stages: [] }), false);

    const resolved = resolveExecutionPlanForTask({
      userPrompt: 'Подготовь план на неделю',
      businessDescription: 'Я инвест-брокер',
      selectedAgents: team.map((agent) => ({ id: agent.id, name: agent.name })),
      executionPlan: { stages: [] } as unknown as ExecutionPlan,
    });

    assert.equal(resolved.stages.length, 3);
  });
});
