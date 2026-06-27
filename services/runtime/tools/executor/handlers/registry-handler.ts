import {
  ToolExecutionError,
  ToolNotFoundError,
  ToolValidationError,
} from '@/services/runtime/tools/executor/executor-errors';
import type { ToolExecution } from '@/services/runtime/tools/executor/executor-types';
import { toolRegistry } from '@/services/runtime/tools/tool-registry';
import type { RegisteredTool, ToolHandlerContext } from '@/services/runtime/tools/tool-types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateArgumentType(
  value: unknown,
  expectedType: string,
  path: string,
  errors: string[],
): void {
  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${path} must be a string`);
      }
      break;
    case 'integer':
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors.push(`${path} must be a number`);
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(`${path} must be a boolean`);
      }
      break;
    case 'object':
      if (!isPlainObject(value)) {
        errors.push(`${path} must be an object`);
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`${path} must be an array`);
      }
      break;
    default:
      break;
  }
}

function validateArgumentsAgainstSchema(
  args: Record<string, unknown>,
  schema: Record<string, unknown>,
  errors: string[],
): void {
  const properties = schema.properties;

  if (!isPlainObject(properties)) {
    errors.push('Tool input schema must define properties');
    return;
  }

  const required = Array.isArray(schema.required)
    ? schema.required.filter((field): field is string => typeof field === 'string')
    : [];

  for (const field of required) {
    if (!(field in args)) {
      errors.push(`Missing required argument: ${field}`);
    }
  }

  if (schema.additionalProperties === false) {
    for (const key of Object.keys(args)) {
      if (!(key in properties)) {
        errors.push(`Unknown argument: ${key}`);
      }
    }
  }

  for (const [key, definition] of Object.entries(properties)) {
    if (!(key in args)) {
      continue;
    }

    if (!isPlainObject(definition) || typeof definition.type !== 'string') {
      continue;
    }

    validateArgumentType(args[key], definition.type, key, errors);
  }
}

export function validateRegisteredToolMetadata(
  tool: RegisteredTool,
  execution: ToolExecution,
): string[] {
  const errors: string[] = [];

  if (!tool.enabled) {
    errors.push(`Tool is disabled: ${tool.id}`);
  }

  if (!isPlainObject(tool.inputSchema) || Object.keys(tool.inputSchema).length === 0) {
    errors.push(`Tool input schema is missing: ${tool.id}`);
  }

  if (!isPlainObject(tool.outputSchema) || Object.keys(tool.outputSchema).length === 0) {
    errors.push(`Tool output schema is missing: ${tool.id}`);
  }

  if (!tool.handler) {
    errors.push(`Tool handler is missing: ${tool.id}`);
  }

  if (isPlainObject(tool.inputSchema)) {
    validateArgumentsAgainstSchema(execution.call.arguments, tool.inputSchema, errors);
  }

  return errors;
}

function buildHandlerContext(execution: ToolExecution): ToolHandlerContext {
  return {
    organizationId: execution.scope.organizationId,
    runId: execution.trace.runId,
    traceId: execution.trace.traceId,
    employeeId: execution.employee.id,
  };
}

export async function executeRegisteredToolHandler(
  execution: ToolExecution,
  tool: RegisteredTool,
): Promise<Record<string, unknown>> {
  try {
    return await tool.handler.execute(execution.call.arguments, buildHandlerContext(execution));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tool handler execution failed';
    throw new ToolExecutionError(message);
  }
}

export function resolveRegisteredTool(toolId: string): RegisteredTool {
  const tool = toolRegistry.get(toolId);

  if (!tool) {
    throw new ToolNotFoundError(toolId);
  }

  return tool;
}

export function hasRegisteredTool(toolId: string): boolean {
  return toolRegistry.exists(toolId);
}

export function listRegisteredToolSummaries(): Array<{
  id: string;
  category: string;
  enabled: boolean;
  description: string;
}> {
  return toolRegistry.list().map((tool) => ({
    id: tool.id,
    category: tool.category,
    enabled: tool.enabled,
    description: tool.description,
  }));
}

export function prepareRegistryTool(execution: ToolExecution): RegisteredTool {
  const tool = resolveRegisteredTool(execution.call.name);
  const metadataErrors = validateRegisteredToolMetadata(tool, execution);

  if (metadataErrors.length > 0) {
    throw new ToolValidationError(metadataErrors.join('; '));
  }

  return tool;
}

export async function executeViaRegistry(
  execution: ToolExecution,
): Promise<Record<string, unknown>> {
  const tool = prepareRegistryTool(execution);
  return executeRegisteredToolHandler(execution, tool);
}
