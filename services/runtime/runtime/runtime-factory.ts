import type { AutomationController } from '@/services/runtime/orchestrator/automation/automation-controller';
import { createAutomationController } from '@/services/runtime/orchestrator/automation/automation-controller';
import type { RuntimeCoordinator } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator';
import { createRuntimeCoordinator } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator';
import { createMockRuntimeCoordinatorProvider } from '@/services/runtime/orchestrator/coordinator/providers/mock-runtime-coordinator-provider';
import { createMockRuntimeOrchestratorProvider } from '@/services/runtime/orchestrator/engine/providers/mock-runtime-orchestrator-provider';
import { createMockRuntimeEventProvider } from '@/services/runtime/orchestrator/events/providers/mock-runtime-event-provider';
import {
  createOrchestratorHub,
  type OrchestratorHub,
} from '@/services/runtime/orchestrator/hub/orchestrator-hub';
import {
  createRoadmapPlanner,
  type RoadmapPlanner,
} from '@/services/runtime/orchestrator/roadmap/roadmap-planner';
import {
  createRuntimeRunner,
  type RuntimeRunner,
} from '@/services/runtime/orchestrator/runner/runtime-runner';
import {
  createRoadmapSession,
  type RoadmapSession,
} from '@/services/runtime/orchestrator/session/roadmap-session';
import {
  createRuntimeStateMachine,
  type RuntimeStateMachine,
} from '@/services/runtime/orchestrator/state/runtime-state-machine';
import { createMockRuntimeStateProvider } from '@/services/runtime/orchestrator/state/providers/mock-runtime-state-provider';
import type { RuntimeFactoryOptions } from '@/services/runtime/runtime/runtime-types';

export interface RuntimeComponents {
  stateMachine: RuntimeStateMachine;
  coordinator: RuntimeCoordinator;
  runner: RuntimeRunner;
  automation: AutomationController;
  planner: RoadmapPlanner;
  hub: OrchestratorHub;
  session: RoadmapSession;
}

export function createRuntimeComponents(options?: RuntimeFactoryOptions): RuntimeComponents {
  const stateProvider = options?.stateProvider ?? createMockRuntimeStateProvider();
  const coordinatorProvider =
    options?.coordinatorProvider ?? createMockRuntimeCoordinatorProvider();

  const stateMachine = createRuntimeStateMachine({ provider: stateProvider });
  const coordinator = createRuntimeCoordinator({
    provider: coordinatorProvider,
    stateProvider,
    orchestratorProvider: options?.orchestratorProvider ?? createMockRuntimeOrchestratorProvider(),
    eventProvider: options?.eventProvider ?? createMockRuntimeEventProvider(),
  });
  const runner = createRuntimeRunner({ coordinator });
  const automation = createAutomationController({ policy: options?.policy });
  const planner = createRoadmapPlanner();
  const hub = createOrchestratorHub({
    runner,
    automation,
    provider: options?.hubProvider,
    policy: options?.policy,
    skipRuntime: options?.skipRuntime,
  });
  const session = createRoadmapSession({
    hub,
    provider: options?.sessionProvider,
    skipRuntime: options?.skipRuntime,
    maxSprintsPerRun: options?.maxSprintsPerRun,
  });

  return {
    stateMachine,
    coordinator,
    runner,
    automation,
    planner,
    hub,
    session,
  };
}
