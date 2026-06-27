import { compilePrompt } from '@/services/runtime/prompt/prompt-compiler';
import { estimateMessagesTokens } from '@/services/runtime/prompt/tokens';
import type { CompilePromptInput } from '@/services/runtime/prompt/types';
import {
  RuntimePromptCompileError,
  RuntimePromptValidationError,
} from '@/services/runtime/runtime-prompt-errors';
import {
  serializeRuntimePromptPreview,
  serializeRuntimePromptSnapshot,
} from '@/services/runtime/runtime-prompt-serializer';
import {
  RUNTIME_PROMPT_PREVIEW_MAX_CHARS,
  type RuntimePromptAdapterOptions,
  type RuntimePromptCompileRequest,
  type RuntimePromptCompileResponse,
  type RuntimePromptDependencies,
  type RuntimePromptPreviewResponse,
  type RuntimePromptSnapshot,
  type RuntimePromptValidationView,
  type SerializedRuntimePromptSnapshot,
} from '@/services/runtime/runtime-prompt-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateCompileRequest(request: RuntimePromptCompileRequest): RuntimePromptValidationView {
  const errors: string[] = [];

  if (!request || typeof request !== 'object') {
    return { valid: false, errors: ['request must be an object'] };
  }

  if (!request.context || typeof request.context !== 'object') {
    errors.push('context is required');
  } else {
    if (!isNonEmptyString(request.context.scope?.organizationId)) {
      errors.push('context.scope.organizationId is required');
    }

    if (!isNonEmptyString(request.context.trace?.runId)) {
      errors.push('context.trace.runId is required');
    }

    if (!isNonEmptyString(request.context.trace?.traceId)) {
      errors.push('context.trace.traceId is required');
    }

    if (!isNonEmptyString(request.context.employee?.id)) {
      errors.push('context.employee.id is required');
    }

    if (!isNonEmptyString(request.context.model?.code)) {
      errors.push('context.model.code is required');
    }

    if (!isNonEmptyString(request.context.userIntent?.action)) {
      errors.push('context.userIntent.action is required');
    }
  }

  if (request.conversationHistory !== undefined && !Array.isArray(request.conversationHistory)) {
    errors.push('conversationHistory must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertValidRequest(request: RuntimePromptCompileRequest): void {
  const validation = validateCompileRequest(request);

  if (!validation.valid) {
    throw new RuntimePromptValidationError(validation.errors.join('; '));
  }
}

function truncatePreview(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content;
  }

  return `${content.slice(0, maxChars)}…`;
}

function buildPreview(
  compiled: RuntimePromptCompileResponse,
  estimatedTokens: number,
): RuntimePromptPreviewResponse {
  const roles = [...new Set(compiled.messages.map((message) => message.role))];

  return {
    model: compiled.model,
    compilerVersion: compiled.metadata.compilerVersion,
    messageCount: compiled.messages.length,
    estimatedTokens,
    toolCount: compiled.tools?.length ?? 0,
    roles,
    messages: compiled.messages.map((message) => ({
      role: message.role,
      contentPreview: truncatePreview(message.content, RUNTIME_PROMPT_PREVIEW_MAX_CHARS),
      contentLength: message.content.length,
    })),
  };
}

function createDefaultDependencies(): RuntimePromptDependencies {
  return {
    compile: (request: CompilePromptInput) => compilePrompt(request),
    estimateTokens: (messages) => estimateMessagesTokens(messages),
  };
}

/**
 * Runtime-facing prompt adapter. Delegates to existing Prompt Compiler only.
 */
export class RuntimePromptAdapter {
  private snapshot: RuntimePromptSnapshot = {
    lastOperation: null,
    lastRunId: null,
    lastModel: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(private readonly dependencies: RuntimePromptDependencies) {}

  compile(request: RuntimePromptCompileRequest): RuntimePromptCompileResponse {
    assertValidRequest(request);

    try {
      const compiled = this.dependencies.compile(request);
      this.touch('compile', request.context.trace.runId, compiled.model);
      return compiled;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Prompt compilation failed';
      throw new RuntimePromptCompileError(message);
    }
  }

  validate(request: RuntimePromptCompileRequest): RuntimePromptValidationView {
    const result = validateCompileRequest(request);
    this.touch(
      'validate',
      request.context?.trace?.runId ?? null,
      request.context?.model?.code ?? null,
    );
    return result;
  }

  preview(request: RuntimePromptCompileRequest): RuntimePromptPreviewResponse {
    const compiled = this.compile(request);
    const estimatedTokens = this.dependencies.estimateTokens(compiled.messages);
    const preview = buildPreview(compiled, estimatedTokens);
    this.touch('preview', request.context.trace.runId, compiled.model);
    return serializeRuntimePromptPreview(preview);
  }

  serialize(): SerializedRuntimePromptSnapshot {
    return serializeRuntimePromptSnapshot(this.snapshot);
  }

  reset(): void {
    this.snapshot = {
      lastOperation: null,
      lastRunId: null,
      lastModel: null,
      updatedAt: new Date().toISOString(),
    };
  }

  private touch(
    operation: RuntimePromptSnapshot['lastOperation'],
    runId: string | null,
    model: string | null,
  ): void {
    this.snapshot = {
      lastOperation: operation,
      lastRunId: runId,
      lastModel: model,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimePromptAdapter(
  options?: RuntimePromptAdapterOptions,
): RuntimePromptAdapter {
  const defaults = createDefaultDependencies();
  const dependencies: RuntimePromptDependencies = {
    compile: options?.dependencies?.compile ?? defaults.compile,
    estimateTokens: options?.dependencies?.estimateTokens ?? defaults.estimateTokens,
  };

  return new RuntimePromptAdapter(dependencies);
}

/** Default dev/test singleton. Do not use for concurrent production prompt compilations. */
export const runtimePromptAdapter = createRuntimePromptAdapter();
