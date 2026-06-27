import type { RuntimeContextAdapter } from '@/services/runtime/runtime-context-adapter';
import type { RuntimeExecution } from '@/services/runtime/runtime-execution';
import type { RuntimeGatewayAdapter } from '@/services/runtime/runtime-gateway-adapter';
import type { RuntimeMemoryAdapter } from '@/services/runtime/runtime-memory-adapter';
import type { RuntimePipelineAdapter } from '@/services/runtime/runtime-pipeline-adapter';
import type { RuntimePromptAdapter } from '@/services/runtime/runtime-prompt-adapter';
import type { RuntimeToolAdapter } from '@/services/runtime/runtime-tool-adapter';
import type { Runtime } from '@/services/runtime/runtime/runtime';

export type RuntimeValidationComponentId =
  | 'context'
  | 'memory'
  | 'prompt'
  | 'pipeline'
  | 'tool'
  | 'gateway'
  | 'execution'
  | 'facade'
  | 'bridge';

export interface RuntimeValidationComponentCheck {
  component: RuntimeValidationComponentId;
  ready: boolean;
  message: string | null;
  errors: string[];
}

export interface RuntimeValidationReport {
  valid: boolean;
  checkedAt: string;
  componentCount: number;
  readyCount: number;
  adaptersValid: boolean;
  bridgeValid: boolean;
  executionValid: boolean;
  facadeValid: boolean;
  errors: string[];
  components: RuntimeValidationComponentCheck[];
}

export interface SerializedRuntimeValidationReport {
  valid: boolean;
  checkedAt: string;
  componentCount: number;
  readyCount: number;
  adaptersValid: boolean;
  bridgeValid: boolean;
  executionValid: boolean;
  facadeValid: boolean;
  errorCount: number;
  errors: string[];
  components: Array<{
    component: RuntimeValidationComponentId;
    ready: boolean;
    message: string | null;
    errorCount: number;
    errors: string[];
  }>;
}

export type RuntimeValidationOperation =
  | 'validateRuntime'
  | 'validateBridge'
  | 'validateAdapters'
  | 'validateExecution'
  | null;

export interface RuntimeValidatorSnapshot {
  lastOperation: RuntimeValidationOperation;
  lastValid: boolean | null;
  lastReadyCount: number | null;
  lastComponentCount: number | null;
  updatedAt: string;
}

export interface SerializedRuntimeValidatorSnapshot {
  lastOperation: RuntimeValidationOperation;
  lastValid: boolean | null;
  lastReadyCount: number | null;
  lastComponentCount: number | null;
  updatedAt: string;
}

export interface RuntimeValidatorBridgeLike {
  status(): unknown;
  serialize(): unknown;
  getFacade(): Runtime;
  getGatewayAdapter(): RuntimeGatewayAdapter;
  getToolAdapter(): RuntimeToolAdapter;
  getPromptAdapter(): RuntimePromptAdapter;
  getMemoryAdapter(): RuntimeMemoryAdapter;
  getContextAdapter(): RuntimeContextAdapter;
  getPipelineAdapter(): RuntimePipelineAdapter;
  getExecution(): RuntimeExecution;
}

export interface RuntimeValidatorDependencies {
  bridge: RuntimeValidatorBridgeLike;
}

export interface RuntimeValidatorOptions {
  bridge?: RuntimeValidatorBridgeLike;
  dependencies?: Partial<RuntimeValidatorDependencies>;
}

export type { RuntimeExecution };
