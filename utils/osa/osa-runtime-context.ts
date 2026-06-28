import {
  buildExecutionPlanSummary,
  formatExecutionPlanEta,
  resolveExecutionPlanForTask,
  serializeExecutionPlan,
  type ExecutionPlan,
} from '@/utils/osa/execution-planner';
import {
  buildExecutionGraph,
  serializeExecutionGraph,
  type ExecutionGraph,
} from '@/utils/osa/team-execution';
import {
  buildOsaAgentTrace,
  prepareOsaTaskSubmitInput,
  type OsaTaskAgentRef,
  type OsaTaskSubmitInput,
  type PreparedOsaTaskSubmitInput,
} from '@/utils/osa/osa-task';

export type OsaRuntimePromptContext = {
  taskGoal: string;
  businessDescription: string;
  selectedAgents: OsaTaskAgentRef[];
  agentTrace: string[];
  executionPlanSummary: string;
  executionPlanText: string;
  executionMode: ExecutionPlan['executionMode'];
  estimatedMinutes: number;
  reviewRequired: boolean;
};

export type BuildOsaRuntimeInputOptions = {
  sessionId: string;
  source?: string;
};

function formatDependencyList(dependsOn: string[]): string {
  return dependsOn.length > 0 ? dependsOn.join(', ') : '(none)';
}

export function formatExecutionPlanForRuntime(plan: ExecutionPlan): string {
  const lines: string[] = [
    '=== OSA EXECUTION PLAN ===',
    `ETA: ${formatExecutionPlanEta(plan.estimatedMinutes)}`,
    `Execution mode: ${plan.executionMode}`,
    `Review required: ${plan.reviewRequired ? 'yes' : 'no'}`,
    '',
    '--- Stages ---',
  ];

  for (const [index, stage] of plan.stages.entries()) {
    const agentNames = stage.assignedAgents.map((agent) => agent.name).join(', ') || '(none)';

    lines.push(
      `Stage ${index + 1}: ${stage.id}`,
      `  Title: ${stage.title}`,
      `  Description: ${stage.description}`,
      `  Assigned agents: ${agentNames}`,
      `  Estimated: ${stage.estimatedMinutes} min`,
      `  Depends on: ${formatDependencyList(stage.dependsOn)}`,
      `  Parallel: ${stage.parallel ? 'yes' : 'no'}`,
      '',
    );
  }

  lines.push('--- Dependencies ---');

  for (const stage of plan.stages) {
    lines.push(`  ${stage.id} -> ${formatDependencyList(plan.dependencies[stage.id] ?? [])}`);
  }

  if (plan.parallelGroups.length > 0) {
    lines.push('', '--- Parallel groups ---');

    for (const [index, group] of plan.parallelGroups.entries()) {
      lines.push(`  Group ${index + 1}: ${group.join(', ')}`);
    }
  }

  lines.push('', '--- Risks ---');

  if (plan.risks.length === 0) {
    lines.push('  (none detected)');
  } else {
    for (const risk of plan.risks) {
      lines.push(
        `  [${risk.severity}] ${risk.title}: ${risk.description} Mitigation: ${risk.mitigation}`,
      );
    }
  }

  return lines.join('\n').trim();
}

export function buildOsaRuntimePromptContext(
  input: PreparedOsaTaskSubmitInput,
): OsaRuntimePromptContext {
  const plan = input.executionPlan;

  return {
    taskGoal: input.userPrompt.trim(),
    businessDescription: input.businessDescription.trim(),
    selectedAgents: input.selectedAgents,
    agentTrace: buildOsaAgentTrace(input.selectedAgents),
    executionPlanSummary: buildExecutionPlanSummary(plan),
    executionPlanText: formatExecutionPlanForRuntime(plan),
    executionMode: plan.executionMode,
    estimatedMinutes: plan.estimatedMinutes,
    reviewRequired: plan.reviewRequired,
  };
}

export function buildOsaRuntimeInput(
  input: OsaTaskSubmitInput,
  options: BuildOsaRuntimeInputOptions,
): Record<string, unknown> {
  const prepared = prepareOsaTaskSubmitInput(input);
  const context = buildOsaRuntimePromptContext(prepared);
  const executionGraph = buildExecutionGraph({
    plan: prepared.executionPlan,
    graphId: `osa-graph-${options.sessionId}`,
  });

  return {
    userPrompt: context.taskGoal,
    businessDescription: context.businessDescription,
    taskGoal: context.taskGoal,
    selectedAgents: context.selectedAgents,
    agentTrace: context.agentTrace,
    sessionId: options.sessionId,
    source: options.source ?? 'osa_workspace',
    executionPlan: serializeExecutionPlan(prepared.executionPlan),
    executionPlanSummary: context.executionPlanSummary,
    executionPlanText: context.executionPlanText,
    executionMode: context.executionMode,
    estimatedMinutes: context.estimatedMinutes,
    reviewRequired: context.reviewRequired,
    executionGraph: serializeExecutionGraph(executionGraph),
    executionGraphSummary: `${executionGraph.totalTasks} tasks · ${executionGraph.progress}% · ETA ${formatExecutionPlanEta(executionGraph.eta)}`,
    osaRuntimeContext: context,
  };
}

export function buildOsaRuntimeInputFromTaskCall(
  input: PreparedOsaTaskSubmitInput,
  taskPayload: Record<string, unknown>,
  options: BuildOsaRuntimeInputOptions,
): Record<string, unknown> {
  const base = buildOsaRuntimeInput(input, options);

  return {
    ...base,
    ...taskPayload,
    userPrompt: typeof taskPayload.userGoal === 'string' ? taskPayload.userGoal : base.userPrompt,
    businessDescription:
      typeof taskPayload.businessContext === 'string'
        ? taskPayload.businessContext
        : base.businessDescription,
    taskGoal: typeof taskPayload.userGoal === 'string' ? taskPayload.userGoal : base.taskGoal,
  };
}

export function buildOsaExecutionGraph(input: OsaTaskSubmitInput, graphId: string): ExecutionGraph {
  const prepared = prepareOsaTaskSubmitInput(input);

  return buildExecutionGraph({
    plan: prepared.executionPlan,
    graphId,
  });
}

export function resolveOsaRuntimePromptContext(input: OsaTaskSubmitInput): OsaRuntimePromptContext {
  return buildOsaRuntimePromptContext({
    ...input,
    executionPlan: resolveExecutionPlanForTask(input),
  });
}
