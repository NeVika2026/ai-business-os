import {
  createAutomationController,
  type AutomationController,
} from '@/services/runtime/orchestrator/automation/automation-controller';
import {
  DEFAULT_AUTOMATION_POLICY,
  type AutomationPolicy,
} from '@/services/runtime/orchestrator/automation/automation-policy';
import {
  buildHubPlanWithOutcome,
  mapRunnerToImplementOutcome,
  resolveHubPhase,
} from '@/services/runtime/orchestrator/hub/hub-executor';
import type {
  HubExecutionRecord,
  HubExecutionResult,
  HubProvider,
  HubReport,
  HubRuntimeContext,
  HubSprintInput,
  HubStatusView,
  OrchestratorHubOptions,
} from '@/services/runtime/orchestrator/hub/hub-types';
import { validateHubSprintInput } from '@/services/runtime/orchestrator/hub/hub-validator';
import {
  createMockHubProvider,
  mockHubProvider,
} from '@/services/runtime/orchestrator/hub/providers/mock-hub-provider';
import { compileSprintPlan } from '@/services/runtime/orchestrator/roadmap/roadmap-planner';
import {
  createRuntimeRunner,
  type RuntimeRunner,
} from '@/services/runtime/orchestrator/runner/runtime-runner';
import type { RunnerRunResult } from '@/services/runtime/orchestrator/runner/runtime-runner-types';

function buildExecutionResult(record: HubExecutionRecord): HubExecutionResult {
  const automationReport = record.automationReport;
  const runnerResult = record.runnerResult;

  return {
    sprintId: record.sprintId,
    sprintCode: record.sprintCode,
    planId: record.planId,
    phase: record.phase,
    finished: record.phase === 'completed',
    paused: record.phase === 'paused',
    failed: record.phase === 'failed',
    runnerExecutedTasks: runnerResult?.executedTasks ?? [],
    automationStepsExecuted: record.automationResult?.stepsExecuted ?? 0,
    stopReason: record.automationResult?.reason ?? null,
    nextRecommendedAction: automationReport?.nextRecommendedAction ?? null,
  };
}

/**
 * Execution hub wiring roadmap sprint plans, runtime runner, and automation controller.
 */
export class OrchestratorHub {
  private activeSprintId: string | null = null;
  private lastExecution: HubExecutionResult | null = null;

  private readonly automation: AutomationController;
  private readonly runner: RuntimeRunner;
  private readonly defaultSkipRuntime: boolean;

  constructor(
    private readonly provider: HubProvider,
    private readonly policy: AutomationPolicy = DEFAULT_AUTOMATION_POLICY,
    options?: OrchestratorHubOptions,
  ) {
    this.automation = createAutomationController({ policy: this.policy });
    this.runner = createRuntimeRunner();
    this.defaultSkipRuntime = options?.skipRuntime ?? false;
  }

  executeSprint(input: HubSprintInput): HubExecutionResult {
    validateHubSprintInput(input);

    const skipRuntime = input.skipRuntime ?? this.defaultSkipRuntime;
    const now = new Date().toISOString();
    this.activeSprintId = input.sprint.id;

    this.automation.reset();
    this.runner.reset();

    let runnerResult: RunnerRunResult | null = null;

    if (!skipRuntime) {
      const context = input.runtimeContext as HubRuntimeContext;
      this.runner.start(context);
      runnerResult = this.runner.run();
    }

    const implementOutcome = mapRunnerToImplementOutcome(runnerResult);
    const basePlan = compileSprintPlan(input.sprint);
    const plan = buildHubPlanWithOutcome(basePlan, implementOutcome);

    this.automation.start(plan);
    const automationResult = this.automation.runUntilStop();
    const automationReport = this.automation.report();

    const phase = resolveHubPhase({
      runnerResult,
      automationStatus: automationResult.controllerStatus,
      skipRuntime,
    });

    const record: HubExecutionRecord = {
      sprintId: input.sprint.id,
      sprintCode: input.sprint.code,
      planId: plan.id,
      phase,
      runnerResult,
      automationResult,
      automationReport,
      startedAt: now,
      updatedAt: new Date().toISOString(),
      finishedAt: phase === 'completed' || phase === 'failed' || phase === 'paused' ? now : null,
    };

    this.provider.save(record);
    this.lastExecution = buildExecutionResult(record);

    return this.lastExecution;
  }

  status(): HubStatusView {
    const record = this.activeSprintId ? this.provider.get(this.activeSprintId) : null;

    return {
      activeSprintId: this.activeSprintId,
      activeSprintCode: record?.sprintCode ?? null,
      phase: record?.phase ?? 'completed',
      runnerStatus: this.safeRunnerStatus(),
      automationStatus: this.safeAutomationStatus(),
      lastExecution: this.lastExecution,
    };
  }

  report(): HubReport {
    const record = this.activeSprintId ? this.provider.get(this.activeSprintId) : null;

    if (!record) {
      return {
        sprintId: null,
        sprintCode: null,
        phase: 'completed',
        runner: null,
        automation: null,
        nextRecommendedAction: null,
      };
    }

    return {
      sprintId: record.sprintId,
      sprintCode: record.sprintCode,
      phase: record.phase,
      runner: record.runnerResult
        ? {
            finished: record.runnerResult.finished,
            executedTasks: [...record.runnerResult.executedTasks],
            duration: record.runnerResult.duration,
            finalStatus: record.runnerResult.finalStatus,
          }
        : null,
      automation: record.automationReport,
      nextRecommendedAction: record.automationReport?.nextRecommendedAction ?? null,
    };
  }

  reset(): void {
    this.activeSprintId = null;
    this.lastExecution = null;
    this.provider.reset?.();
    this.automation.reset();
    this.runner.reset();
  }

  private safeRunnerStatus() {
    try {
      return this.runner.status();
    } catch {
      return null;
    }
  }

  private safeAutomationStatus() {
    try {
      return this.automation.status();
    } catch {
      return null;
    }
  }
}

export function createOrchestratorHub(options?: OrchestratorHubOptions): OrchestratorHub {
  const provider = options?.provider ?? mockHubProvider;
  const policy = options?.policy ?? DEFAULT_AUTOMATION_POLICY;

  return new OrchestratorHub(provider, policy, options);
}

/** Default dev/test singleton. Do not use for concurrent production executions. */
export const orchestratorHub = createOrchestratorHub();

export { createMockHubProvider, mockHubProvider };
