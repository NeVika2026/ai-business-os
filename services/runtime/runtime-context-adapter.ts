import { buildContext } from '@/services/runtime/context/context-builder';
import type { BuildContextInput } from '@/services/runtime/context/types';
import {
  RuntimeContextBuildError,
  RuntimeContextValidationError,
} from '@/services/runtime/runtime-context-errors';
import type { RuntimeKnowledgeContext } from '@/services/runtime/runtime-knowledge-context';
import {
  serializeRuntimeContextPackage,
  serializeRuntimeContextPreview,
  serializeRuntimeContextSnapshot,
} from '@/services/runtime/runtime-context-serializer';
import type {
  RuntimeContextAdapterOptions,
  RuntimeContextBuildRequest,
  RuntimeContextDependencies,
  RuntimeContextSnapshot,
  RuntimeContextValidationView,
  SerializedRuntimeContextPackage,
  SerializedRuntimeContextPreview,
  SerializedRuntimeContextSnapshot,
} from '@/services/runtime/runtime-context-types';
import type { ContextPackage } from '@/types/runtime/dto';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateBuildRequest(request: RuntimeContextBuildRequest): RuntimeContextValidationView {
  const errors: string[] = [];

  if (!request || typeof request !== 'object') {
    return { valid: false, errors: ['request must be an object'] };
  }

  if (!isNonEmptyString(request.scope?.organizationId)) {
    errors.push('scope.organizationId is required');
  }

  if (!isNonEmptyString(request.employeeId)) {
    errors.push('employeeId is required');
  }

  if (!request.request || !isNonEmptyString(request.request.action)) {
    errors.push('request.action is required');
  }

  if (!request.request?.payload || typeof request.request.payload !== 'object') {
    errors.push('request.payload must be an object');
  }

  if (!isNonEmptyString(request.trace?.runId)) {
    errors.push('trace.runId is required');
  }

  if (!isNonEmptyString(request.trace?.correlationId)) {
    errors.push('trace.correlationId is required');
  }

  if (!isNonEmptyString(request.trace?.traceId)) {
    errors.push('trace.traceId is required');
  }

  if (
    request.taskId !== undefined &&
    request.taskId !== null &&
    !isNonEmptyString(request.taskId)
  ) {
    errors.push('taskId must be a non-empty string when provided');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertValidRequest(request: RuntimeContextBuildRequest): void {
  const validation = validateBuildRequest(request);

  if (!validation.valid) {
    throw new RuntimeContextValidationError(validation.errors.join('; '));
  }
}

function createDefaultDependencies(): RuntimeContextDependencies {
  return {
    build: (request: BuildContextInput) => buildContext(request),
  };
}

export interface RuntimeContextAdapterFactoryOptions extends RuntimeContextAdapterOptions {
  knowledgeContext?: RuntimeKnowledgeContext;
  knowledgeInjectionEnabled?: boolean;
}

function resolveKnowledgeQuery(request: RuntimeContextBuildRequest): string {
  const payload = request.request.payload;
  const explicitQuery = payload.knowledgeQuery;

  if (typeof explicitQuery === 'string' && explicitQuery.trim().length > 0) {
    return explicitQuery.trim();
  }

  return request.request.action;
}

function resolveKnowledgeInjectionEnabled(
  request: RuntimeContextBuildRequest,
  adapterEnabled: boolean,
  knowledgeContext: RuntimeKnowledgeContext | null,
): boolean {
  const payloadFlag = request.request.payload.knowledgeInjectionEnabled;

  if (payloadFlag === true) {
    return true;
  }

  if (payloadFlag === false) {
    return false;
  }

  return adapterEnabled || (knowledgeContext?.isEnabled() ?? false);
}

/**
 * Runtime-facing context adapter. Delegates to existing Context Builder only.
 */
export class RuntimeContextAdapter {
  private snapshot: RuntimeContextSnapshot = {
    lastOperation: null,
    lastRunId: null,
    lastModelCode: null,
    lastEmployeeId: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(
    private readonly dependencies: RuntimeContextDependencies,
    private readonly knowledgeContext: RuntimeKnowledgeContext | null,
    private readonly knowledgeInjectionEnabled: boolean,
  ) {}

  build(request: RuntimeContextBuildRequest): SerializedRuntimeContextPackage {
    assertValidRequest(request);

    try {
      const context = this.enrichWithKnowledge(this.dependencies.build(request), request);
      const serialized = serializeRuntimeContextPackage(context);
      this.touch('build', request.trace.runId, context.model.code, request.employeeId);
      return serialized;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Context build failed';
      throw new RuntimeContextBuildError(message);
    }
  }

  preview(request: RuntimeContextBuildRequest): SerializedRuntimeContextPreview {
    assertValidRequest(request);

    try {
      const context = this.enrichWithKnowledge(this.dependencies.build(request), request);
      const preview = serializeRuntimeContextPreview(context);
      this.touch('preview', request.trace.runId, context.model.code, request.employeeId);
      return preview;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Context preview failed';
      throw new RuntimeContextBuildError(message);
    }
  }

  validate(request: RuntimeContextBuildRequest): RuntimeContextValidationView {
    const result = validateBuildRequest(request);
    this.touch('validate', request.trace?.runId ?? null, null, request.employeeId ?? null);
    return result;
  }

  serialize(): SerializedRuntimeContextSnapshot {
    return serializeRuntimeContextSnapshot(this.snapshot);
  }

  reset(): void {
    this.snapshot = {
      lastOperation: null,
      lastRunId: null,
      lastModelCode: null,
      lastEmployeeId: null,
      updatedAt: new Date().toISOString(),
    };
    this.knowledgeContext?.reset();
  }

  buildContextPackage(request: RuntimeContextBuildRequest): ContextPackage {
    assertValidRequest(request);
    return this.enrichWithKnowledge(this.dependencies.build(request), request);
  }

  private enrichWithKnowledge(
    context: ContextPackage,
    request: RuntimeContextBuildRequest,
  ): ContextPackage {
    if (!this.knowledgeContext) {
      return context;
    }

    const enabled = resolveKnowledgeInjectionEnabled(
      request,
      this.knowledgeInjectionEnabled,
      this.knowledgeContext,
    );

    if (!enabled) {
      return context;
    }

    try {
      const injection = this.knowledgeContext.build({
        query: resolveKnowledgeQuery(request),
        enabled: true,
      });

      if (injection.knowledgeFailed || injection.chunks.length === 0) {
        return context;
      }

      return this.knowledgeContext.mergeKnowledge(context, injection);
    } catch {
      return context;
    }
  }

  private touch(
    operation: RuntimeContextSnapshot['lastOperation'],
    runId: string | null,
    modelCode: string | null,
    employeeId: string | null,
  ): void {
    this.snapshot = {
      lastOperation: operation,
      lastRunId: runId,
      lastModelCode: modelCode,
      lastEmployeeId: employeeId,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeContextAdapter(
  options?: RuntimeContextAdapterFactoryOptions,
): RuntimeContextAdapter {
  const defaults = createDefaultDependencies();
  const dependencies: RuntimeContextDependencies = {
    build: options?.dependencies?.build ?? defaults.build,
  };

  return new RuntimeContextAdapter(
    dependencies,
    options?.knowledgeContext ?? null,
    options?.knowledgeInjectionEnabled ?? false,
  );
}

/** Default dev/test singleton. Do not use for concurrent production context builds. */
export const runtimeContextAdapter = createRuntimeContextAdapter();
