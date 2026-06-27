import type { AutomationController } from '@/services/runtime/orchestrator/automation/automation-controller';
import type { RuntimeCoordinator } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator';
import type { OrchestratorHub } from '@/services/runtime/orchestrator/hub/orchestrator-hub';
import type { RoadmapPlanner } from '@/services/runtime/orchestrator/roadmap/roadmap-planner';
import type { RuntimeRunner } from '@/services/runtime/orchestrator/runner/runtime-runner';
import type { RoadmapSession } from '@/services/runtime/orchestrator/session/roadmap-session';
import type { RuntimeStateMachine } from '@/services/runtime/orchestrator/state/runtime-state-machine';
import type {
  RuntimeExecuteRoadmapInput,
  RuntimeExecuteRoadmapResult,
  RuntimeExecuteSprintInput,
  RuntimeExecuteSprintResult,
  RuntimeMode,
  RuntimeOptions,
  RuntimeProvider,
  RuntimeRecord,
  RuntimeReport,
  RuntimeStatusView,
  SerializedRuntimeSnapshot,
} from '@/services/runtime/runtime/runtime-types';
import {
  createRuntimeComponents,
  type RuntimeComponents,
} from '@/services/runtime/runtime/runtime-factory';
import {
  createMockRuntimeProvider,
  mockRuntimeProvider,
} from '@/services/runtime/runtime/providers/mock-runtime-provider';
import { serializeRuntimeSnapshot } from '@/services/runtime/runtime/runtime-serializer';
import {
  validateRuntimeExecuteRoadmapInput,
  validateRuntimeExecuteSprintInput,
  validateRuntimeInstanceId,
} from '@/services/runtime/runtime/runtime-validator';

function safeCoordinatorStatus(coordinator: RuntimeCoordinator): string | null {
  try {
    return coordinator.status().status;
  } catch {
    return null;
  }
}

function safeRunnerStatus(runner: RuntimeRunner): string | null {
  try {
    return runner.status().status;
  } catch {
    return null;
  }
}

function safeAutomationStatus(automation: AutomationController): string | null {
  try {
    return automation.status().status;
  } catch {
    return null;
  }
}

function safeStateMachineState(stateMachine: RuntimeStateMachine): string | null {
  try {
    return stateMachine.current().state;
  } catch {
    return null;
  }
}

/**
 * Unified orchestration facade for roadmap and sprint execution.
 * Does not invoke Gateway, Tool Executor, Memory, or LLM providers.
 */
export class Runtime {
  private mode: RuntimeMode = 'idle';
  private roadmapId: string | null = null;
  private sprintId: string | null = null;
  private lastRoadmapResult: RuntimeRecord['lastRoadmapResult'] = null;
  private lastSprintResult: RuntimeRecord['lastSprintResult'] = null;

  private readonly components: RuntimeComponents;
  private readonly instanceId: string;

  constructor(
    private readonly provider: RuntimeProvider,
    components: RuntimeComponents,
    instanceId: string,
  ) {
    this.components = components;
    this.instanceId = instanceId;
  }

  executeRoadmap(input: RuntimeExecuteRoadmapInput): RuntimeExecuteRoadmapResult {
    validateRuntimeExecuteRoadmapInput(input);

    this.resetExecutionState();
    this.mode = 'roadmap';
    this.roadmapId = input.roadmap.id;

    this.components.session.start({
      roadmap: input.roadmap,
      runtimeContext: input.runtimeContext,
      skipRuntime: input.skipRuntime,
    });

    const result = this.components.session.runAllUntilStop();
    this.lastRoadmapResult = result;

    this.persist();

    return {
      roadmapId: input.roadmap.id,
      sessionStatus: result.sessionStatus,
      sprintsExecuted: result.sprintsExecuted,
      stopped: result.stopped,
      reason: result.reason,
    };
  }

  executeSprint(input: RuntimeExecuteSprintInput): RuntimeExecuteSprintResult {
    validateRuntimeExecuteSprintInput(input);

    this.resetExecutionState();
    this.mode = 'sprint';
    this.sprintId = input.sprint.id;

    const result = this.components.hub.executeSprint({
      sprint: input.sprint,
      runtimeContext: input.runtimeContext,
      skipRuntime: input.skipRuntime,
    });

    this.lastSprintResult = result;
    this.persist();

    return result;
  }

  status(): RuntimeStatusView {
    const sessionStatus = this.safeSessionStatus();
    const hubStatus = this.components.hub.status();

    return {
      mode: this.mode,
      roadmapId: this.roadmapId,
      sprintId: this.sprintId ?? hubStatus.activeSprintId,
      sessionStatus,
      hubPhase: hubStatus.phase,
      coordinatorStatus: safeCoordinatorStatus(this.components.coordinator),
      runnerStatus: safeRunnerStatus(this.components.runner),
      automationStatus: safeAutomationStatus(this.components.automation),
      stateMachineState: safeStateMachineState(this.components.stateMachine),
    };
  }

  report(): RuntimeReport {
    const sessionReport = this.safeSessionReport();
    const hubReport = this.components.hub.report();

    const nextRecommendedAction =
      sessionReport?.nextRecommendedAction ?? hubReport.nextRecommendedAction ?? null;

    return {
      mode: this.mode,
      roadmapId: this.roadmapId,
      sprintId: this.sprintId ?? hubReport.sprintId,
      nextRecommendedAction,
      sessionReport,
      hubReport,
    };
  }

  serialize(): SerializedRuntimeSnapshot {
    const record = this.buildRecord();
    const status = this.status();
    return serializeRuntimeSnapshot(record, status);
  }

  reset(): void {
    this.mode = 'idle';
    this.roadmapId = null;
    this.sprintId = null;
    this.lastRoadmapResult = null;
    this.lastSprintResult = null;

    this.components.stateMachine.reset();
    this.components.coordinator.reset();
    this.components.runner.reset();
    this.components.automation.reset();
    this.components.hub.reset();
    this.components.session.reset();

    this.provider.reset?.();
  }

  getStateMachine(): RuntimeStateMachine {
    return this.components.stateMachine;
  }

  getCoordinator(): RuntimeCoordinator {
    return this.components.coordinator;
  }

  getRunner(): RuntimeRunner {
    return this.components.runner;
  }

  getAutomation(): AutomationController {
    return this.components.automation;
  }

  getPlanner(): RoadmapPlanner {
    return this.components.planner;
  }

  getHub(): OrchestratorHub {
    return this.components.hub;
  }

  getSession(): RoadmapSession {
    return this.components.session;
  }

  private resetExecutionState(): void {
    this.components.hub.reset();
    this.components.session.reset();
    this.components.runner.reset();
    this.components.automation.reset();
    this.components.coordinator.reset();
    this.components.stateMachine.reset();
  }

  private safeSessionStatus() {
    try {
      return this.components.session.status().status;
    } catch {
      return null;
    }
  }

  private safeSessionReport() {
    try {
      return this.components.session.report();
    } catch {
      return null;
    }
  }

  private buildRecord(): RuntimeRecord {
    return {
      mode: this.mode,
      roadmapId: this.roadmapId,
      sprintId: this.sprintId,
      lastRoadmapResult: this.lastRoadmapResult,
      lastSprintResult: this.lastSprintResult,
      updatedAt: new Date().toISOString(),
    };
  }

  private persist(): void {
    const record = this.buildRecord();
    const existing = this.provider.get(this.instanceId);

    if (existing) {
      this.provider.update(this.instanceId, record);
    } else {
      this.provider.save(this.instanceId, record);
    }
  }
}

export function createRuntime(options?: RuntimeOptions): Runtime {
  const instanceId = options?.instanceId ?? 'default';
  validateRuntimeInstanceId(instanceId);

  const provider = options?.runtimeProvider ?? mockRuntimeProvider;
  const components = createRuntimeComponents(options);

  return new Runtime(provider, components, instanceId);
}

/** Default dev/test singleton. Do not use for concurrent production executions. */
export const runtime = createRuntime();

export { createMockRuntimeProvider, mockRuntimeProvider };
export {
  createRuntimeComponents,
  type RuntimeComponents,
} from '@/services/runtime/runtime/runtime-factory';
