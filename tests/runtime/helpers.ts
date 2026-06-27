import type { AgentExecution } from '@/types/runtime/dto';
import type { RuntimeExecutionContext } from '@/services/runtime/runtime/runtime-types';
import type {
  RoadmapInput,
  RoadmapSprintInput,
} from '@/services/runtime/orchestrator/roadmap/roadmap-types';

export const TEST_ORG_ID = 'org000001-0000-4000-8000-000000000001';
export const TEST_EMPLOYEE_ID = 'c1000001-0000-4000-8000-000000000001';
export const TEST_RUN_ID = 'run000001-0000-4000-8000-000000000001';
export const TEST_CORRELATION_ID = 'corr00001-0000-4000-8000-000000000001';
export const TEST_TRACE_ID = 'trace0001-0000-4000-8000-000000000001';

export function createAgentExecution(overrides?: Partial<AgentExecution>): AgentExecution {
  return {
    scope: {
      organizationId: TEST_ORG_ID,
    },
    employeeId: TEST_EMPLOYEE_ID,
    input: {
      action: 'summarize_leads',
      payload: {
        trace: {
          runId: TEST_RUN_ID,
          correlationId: TEST_CORRELATION_ID,
          traceId: TEST_TRACE_ID,
        },
      },
    },
    ...overrides,
  };
}

export function createRuntimeContext(
  overrides?: Partial<RuntimeExecutionContext>,
): RuntimeExecutionContext {
  return {
    organizationId: TEST_ORG_ID,
    employeeId: TEST_EMPLOYEE_ID,
    runId: TEST_RUN_ID,
    traceId: TEST_TRACE_ID,
    startedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createRoadmapInput(): RoadmapInput {
  return {
    id: 'roadmap-integration-001',
    title: 'Integration Roadmap',
    sprints: [
      {
        id: 'sprint-integration-001',
        title: 'Foundation Sprint',
        code: 'S10.2',
        description: 'Runtime integration coverage',
        includeValidateStep: true,
        skipLint: true,
        skipBuild: true,
      },
    ],
  };
}

export function createSprintInput(): RoadmapSprintInput {
  return {
    id: 'sprint-integration-002',
    title: 'Sprint Execution',
    code: 'S10.2-B',
    description: 'Single sprint integration',
    includeValidateStep: true,
    skipLint: true,
    skipBuild: true,
  };
}

export function createContextBuildRequest() {
  return {
    scope: { organizationId: TEST_ORG_ID },
    trace: {
      runId: TEST_RUN_ID,
      correlationId: TEST_CORRELATION_ID,
      traceId: TEST_TRACE_ID,
    },
    employeeId: TEST_EMPLOYEE_ID,
    request: {
      action: 'summarize_leads',
      payload: {},
    },
  };
}

export function createMemoryReadRequest() {
  return {
    scope: { organizationId: TEST_ORG_ID },
    trace: {
      runId: TEST_RUN_ID,
      correlationId: TEST_CORRELATION_ID,
      traceId: TEST_TRACE_ID,
    },
    employeeId: TEST_EMPLOYEE_ID,
  };
}
