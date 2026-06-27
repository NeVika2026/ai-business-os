import type { AgentExecution, AgentResult } from '@/types/runtime/dto';
import type { RuntimeExecution } from '@/services/runtime/runtime-execution';
import type { SerializedRuntimeValidationReport } from '@/services/runtime/runtime-validator-types';
import type { Runtime } from '@/services/runtime/runtime/runtime';
import type { RuntimeStatusView } from '@/services/runtime/runtime/runtime-types';

export const RUNTIME_API_VERSION = '1.0.0';

export interface RuntimeApiExecuteRequest {
  execution: AgentExecution;
  useFullExecution?: boolean;
  useLegacyPipeline?: boolean;
}

export interface RuntimeApiValidationView {
  valid: boolean;
  errors: string[];
}

export interface RuntimeApiStatusView {
  bridgeMode: string;
  agentStatus: AgentResult['status'] | null;
  facadeMode: RuntimeStatusView['mode'];
  facadeCoordinatorStatus: string | null;
  executionRunId: string | null;
  executionStatus: AgentResult['status'] | null;
  validationValid: boolean | null;
  updatedAt: string;
}

export interface RuntimeApiReport {
  version: string;
  bridgeMode: string;
  agentStatus: AgentResult['status'] | null;
  nextRecommendedAction: string | null;
  executionRunId: string | null;
  executionStatus: AgentResult['status'] | null;
  validationValid: boolean | null;
  validationReadyCount: number | null;
  facadeMode: RuntimeStatusView['mode'];
  updatedAt: string;
}

export interface RuntimeApiCapabilities {
  version: string;
  fullExecution: boolean;
  legacyPipeline: boolean;
  orchestration: boolean;
  roadmap: boolean;
  sprint: boolean;
  validation: boolean;
  components: string[];
}

export interface SerializedRuntimeApiReport {
  version: string;
  bridgeMode: string;
  agentStatus: AgentResult['status'] | null;
  nextRecommendedAction: string | null;
  executionRunId: string | null;
  executionStatus: AgentResult['status'] | null;
  validationValid: boolean | null;
  validationReadyCount: number | null;
  facadeMode: RuntimeStatusView['mode'];
  updatedAt: string;
}

export interface SerializedRuntimeApiStatus {
  bridgeMode: string;
  agentStatus: AgentResult['status'] | null;
  facadeMode: RuntimeStatusView['mode'];
  facadeCoordinatorStatus: string | null;
  executionRunId: string | null;
  executionStatus: AgentResult['status'] | null;
  validationValid: boolean | null;
  updatedAt: string;
}

export interface SerializedRuntimeApiSnapshot {
  version: string;
  bridgeMode: string;
  agentStatus: AgentResult['status'] | null;
  executionRunId: string | null;
  executionStatus: AgentResult['status'] | null;
  validationValid: boolean | null;
  facadeMode: RuntimeStatusView['mode'];
  updatedAt: string;
}

export type RuntimeApiOperation = 'execute' | 'validate' | 'reset' | null;

export interface RuntimeApiSnapshot {
  lastOperation: RuntimeApiOperation;
  lastRunId: string | null;
  lastStatus: AgentResult['status'] | null;
  updatedAt: string;
}

export interface RuntimeApiBridgeLike {
  runAgent(
    execution: AgentExecution,
    options?: {
      useFullExecution?: boolean;
      useLegacyPipeline?: boolean;
    },
  ): Promise<AgentResult>;
  readStatus(): {
    mode: string;
    agentStatus: AgentResult['status'] | null;
    facadeStatus: RuntimeStatusView;
  };
  readReport(): {
    mode: string;
    agentResult: AgentResult | null;
    facadeReport: { nextRecommendedAction: string | null; mode: RuntimeStatusView['mode'] };
    nextRecommendedAction: string | null;
  };
  readSnapshot(): {
    mode: string;
    updatedAt: string;
  };
  resetRuntime(): void;
  getExecution(): RuntimeExecution;
  getValidator(): {
    validateRuntime(): { valid: boolean; readyCount: number };
    report(): SerializedRuntimeValidationReport;
    reset(): void;
  };
  getFacade(): Runtime;
  supportsFullExecution(): boolean;
  supportsLegacyPipeline(): boolean;
  supportsOrchestration(): boolean;
}

export interface RuntimeApiDependencies {
  bridge: RuntimeApiBridgeLike;
  execution: RuntimeExecution;
  validator: RuntimeApiBridgeLike['getValidator'] extends () => infer T ? T : never;
  facade: Runtime;
}

export interface RuntimeApiOptions {
  bridge?: RuntimeApiBridgeLike;
  execution?: RuntimeExecution;
  validator?: RuntimeApiDependencies['validator'];
  facade?: Runtime;
}

export type { AgentExecution, AgentResult, RuntimeExecution };
