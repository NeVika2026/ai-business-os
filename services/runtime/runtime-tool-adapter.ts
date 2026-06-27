import {
  hasRegisteredTool,
  listRegisteredToolSummaries,
} from '@/services/runtime/tools/executor/handlers/registry-handler';
import { toolExecutor } from '@/services/runtime/tools/executor/tool-executor';
import type { ToolExecution } from '@/services/runtime/tools/executor/executor-types';
import { RuntimeToolRequestError } from '@/services/runtime/runtime-tool-errors';
import { serializeRuntimeToolSnapshot } from '@/services/runtime/runtime-tool-serializer';
import type {
  RuntimeToolAdapterOptions,
  RuntimeToolDependencies,
  RuntimeToolListResponse,
  RuntimeToolRequest,
  RuntimeToolSnapshot,
  RuntimeToolSummary,
  RuntimeToolValidationView,
  SerializedRuntimeToolSnapshot,
  ToolResult,
} from '@/services/runtime/runtime-tool-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertToolRequest(request: RuntimeToolRequest): void {
  if (!request || typeof request !== 'object') {
    throw new RuntimeToolRequestError('tool request must be an object');
  }

  if (!isNonEmptyString(request.call?.name)) {
    throw new RuntimeToolRequestError('tool id is required');
  }
}

function createDefaultDependencies(): RuntimeToolDependencies {
  return {
    execute: (request: ToolExecution) => toolExecutor.execute(request),
    validate: (request: ToolExecution) => toolExecutor.validate(request),
    hasTool: (toolId: string) => hasRegisteredTool(toolId),
    listTools: () => listRegisteredToolSummaries(),
  };
}

function toRuntimeToolSummary(entry: RuntimeToolSummary): RuntimeToolSummary {
  return {
    id: entry.id,
    category: entry.category,
    enabled: entry.enabled,
    description: entry.description,
  };
}

/**
 * Runtime-facing tool adapter. Delegates to existing Tool Executor only.
 */
export class RuntimeToolAdapter {
  private snapshot: RuntimeToolSnapshot = {
    lastOperation: null,
    lastToolId: null,
    lastSuccess: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(private readonly dependencies: RuntimeToolDependencies) {}

  async execute(toolRequest: RuntimeToolRequest): Promise<ToolResult> {
    assertToolRequest(toolRequest);

    const result = await this.dependencies.execute(toolRequest);
    this.touch('execute', toolRequest.call.name, result.success);
    return result;
  }

  listTools(): RuntimeToolListResponse {
    const tools = this.dependencies.listTools().map(toRuntimeToolSummary);
    this.touch('list', null, null);
    return { tools };
  }

  hasTool(toolId: string): boolean {
    if (!isNonEmptyString(toolId)) {
      return false;
    }

    return this.dependencies.hasTool(toolId);
  }

  validate(toolRequest: RuntimeToolRequest): RuntimeToolValidationView {
    assertToolRequest(toolRequest);

    const result = this.dependencies.validate(toolRequest);
    this.touch('validate', toolRequest.call.name, result.valid);

    return {
      valid: result.valid,
      errors: [...result.errors],
    };
  }

  serialize(): SerializedRuntimeToolSnapshot {
    return serializeRuntimeToolSnapshot(this.snapshot);
  }

  reset(): void {
    this.snapshot = {
      lastOperation: null,
      lastToolId: null,
      lastSuccess: null,
      updatedAt: new Date().toISOString(),
    };
  }

  private touch(
    operation: RuntimeToolSnapshot['lastOperation'],
    toolId: string | null,
    success: boolean | null,
  ): void {
    this.snapshot = {
      lastOperation: operation,
      lastToolId: toolId,
      lastSuccess: success,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeToolAdapter(options?: RuntimeToolAdapterOptions): RuntimeToolAdapter {
  const defaults = createDefaultDependencies();
  const dependencies: RuntimeToolDependencies = {
    execute: options?.dependencies?.execute ?? defaults.execute,
    validate: options?.dependencies?.validate ?? defaults.validate,
    hasTool: options?.dependencies?.hasTool ?? defaults.hasTool,
    listTools: options?.dependencies?.listTools ?? defaults.listTools,
  };

  return new RuntimeToolAdapter(dependencies);
}

/** Default dev/test singleton. Do not use for concurrent production tool executions. */
export const runtimeToolAdapter = createRuntimeToolAdapter();
