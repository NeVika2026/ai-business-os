import { resolveTrace, runPipeline, validateAgentExecution } from '@/services/runtime/pipeline';
import {
  RuntimePipelineExecutionError,
  RuntimePipelineValidationError,
} from '@/services/runtime/runtime-pipeline-errors';
import {
  serializeRuntimePipelineResult,
  serializeRuntimePipelineSnapshot,
} from '@/services/runtime/runtime-pipeline-serializer';
import type {
  AgentExecution,
  AgentResult,
  RuntimePipelineAdapterOptions,
  RuntimePipelineDependencies,
  RuntimePipelineExecution,
  RuntimePipelineSnapshot,
  RuntimePipelineValidationView,
  SerializedRuntimePipelineResult,
  SerializedRuntimePipelineSnapshot,
  TraceContext,
} from '@/services/runtime/runtime-pipeline-types';

function validateExecution(execution: RuntimePipelineExecution): RuntimePipelineValidationView {
  const errors: string[] = [];

  if (!execution || typeof execution !== 'object') {
    return { valid: false, errors: ['execution must be an object'] };
  }

  try {
    validateAgentExecution(execution);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'execution validation failed';
    errors.push(message);
  }

  if (errors.length === 0) {
    try {
      resolveTrace(execution);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'trace resolution failed';
      errors.push(message);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertValidExecution(execution: RuntimePipelineExecution): void {
  const validation = validateExecution(execution);

  if (!validation.valid) {
    throw new RuntimePipelineValidationError(validation.errors.join('; '));
  }
}

function createDefaultDependencies(): RuntimePipelineDependencies {
  return {
    runPipeline: (execution: AgentExecution) => runPipeline(execution),
    validateAgentExecution: (execution: AgentExecution) => validateAgentExecution(execution),
    resolveTrace: (execution: AgentExecution) => resolveTrace(execution),
  };
}

/**
 * Runtime-facing pipeline adapter. Delegates to existing Runtime Pipeline only.
 */
export class RuntimePipelineAdapter {
  private snapshot: RuntimePipelineSnapshot = {
    lastOperation: null,
    lastRunId: null,
    lastStatus: null,
    lastEmployeeId: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(private readonly dependencies: RuntimePipelineDependencies) {}

  async execute(execution: RuntimePipelineExecution): Promise<AgentResult> {
    assertValidExecution(execution);

    try {
      const result = await this.dependencies.runPipeline(execution);
      this.touch('execute', result.trace.runId, result.status, execution.employeeId);
      return result;
    } catch (error) {
      if (error instanceof RuntimePipelineValidationError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Pipeline execution failed';
      throw new RuntimePipelineExecutionError(message);
    }
  }

  validate(execution: RuntimePipelineExecution): RuntimePipelineValidationView {
    const result = validateExecution(execution);
    this.touch('validate', null, null, execution.employeeId ?? null);
    return result;
  }

  resolveTrace(execution: RuntimePipelineExecution): TraceContext {
    assertValidExecution(execution);

    try {
      return this.dependencies.resolveTrace(execution);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Trace resolution failed';
      throw new RuntimePipelineValidationError(message);
    }
  }

  toSerializedResult(result: AgentResult): SerializedRuntimePipelineResult {
    return serializeRuntimePipelineResult(result);
  }

  serialize(): SerializedRuntimePipelineSnapshot {
    return serializeRuntimePipelineSnapshot(this.snapshot);
  }

  reset(): void {
    this.snapshot = {
      lastOperation: null,
      lastRunId: null,
      lastStatus: null,
      lastEmployeeId: null,
      updatedAt: new Date().toISOString(),
    };
  }

  private touch(
    operation: RuntimePipelineSnapshot['lastOperation'],
    runId: string | null,
    status: AgentResult['status'] | null,
    employeeId: string | null,
  ): void {
    this.snapshot = {
      lastOperation: operation,
      lastRunId: runId,
      lastStatus: status,
      lastEmployeeId: employeeId,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimePipelineAdapter(
  options?: RuntimePipelineAdapterOptions,
): RuntimePipelineAdapter {
  const defaults = createDefaultDependencies();
  const dependencies: RuntimePipelineDependencies = {
    runPipeline: options?.dependencies?.runPipeline ?? defaults.runPipeline,
    validateAgentExecution:
      options?.dependencies?.validateAgentExecution ?? defaults.validateAgentExecution,
    resolveTrace: options?.dependencies?.resolveTrace ?? defaults.resolveTrace,
  };

  return new RuntimePipelineAdapter(dependencies);
}

/** Default dev/test singleton. Do not use for concurrent production pipeline executions. */
export const runtimePipelineAdapter = createRuntimePipelineAdapter();
