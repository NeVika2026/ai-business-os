import type {
  ToolExecution,
  ToolValidationResult,
} from '@/services/runtime/tools/executor/executor-types';

const TOOL_ID_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const FORBIDDEN_ARGUMENT_KEYS = new Set(['organization_id', 'org_id', 'tenant_id']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateToolExecution(execution: ToolExecution): ToolValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(execution.call.id)) {
    errors.push('Tool call id is required');
  }

  const toolId = execution.call.name;

  if (!isNonEmptyString(toolId)) {
    errors.push('Tool id is required');
  } else if (!TOOL_ID_PATTERN.test(toolId)) {
    errors.push(`Invalid tool id format: ${toolId}`);
  }

  if (!isNonEmptyString(execution.scope.organizationId)) {
    errors.push('scope.organizationId is required');
  }

  if (!isNonEmptyString(execution.trace.runId)) {
    errors.push('trace.runId is required');
  }

  if (!isNonEmptyString(execution.trace.traceId)) {
    errors.push('trace.traceId is required');
  }

  if (!isNonEmptyString(execution.employee.id)) {
    errors.push('employee.id is required');
  }

  if (!isNonEmptyString(execution.employee.roleTitle)) {
    errors.push('employee.roleTitle is required');
  }

  if (!Array.isArray(execution.employee.enabledTools)) {
    errors.push('employee.enabledTools must be an array');
  }

  if (!isPlainObject(execution.employee.permissions)) {
    errors.push('employee.permissions must be an object');
  }

  if (!isPlainObject(execution.call.arguments)) {
    errors.push('Tool arguments must be an object');
  } else {
    for (const key of Object.keys(execution.call.arguments)) {
      if (FORBIDDEN_ARGUMENT_KEYS.has(key)) {
        errors.push(`Argument "${key}" is not allowed`);
      }
    }
  }

  if (!isNonEmptyString(execution.call.audit.runId)) {
    errors.push('call.audit.runId is required');
  }

  if (!isNonEmptyString(execution.call.audit.employeeId)) {
    errors.push('call.audit.employeeId is required');
  }

  if (!isNonEmptyString(execution.call.audit.organizationId)) {
    errors.push('call.audit.organizationId is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
