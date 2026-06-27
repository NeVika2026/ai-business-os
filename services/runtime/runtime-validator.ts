import { RuntimeValidatorConfigurationError } from '@/services/runtime/runtime-validator-errors';
import {
  buildRuntimeValidationReport,
  serializeRuntimeValidationReport,
  serializeRuntimeValidatorSnapshot,
} from '@/services/runtime/runtime-validator-serializer';
import type { RuntimeContextAdapter } from '@/services/runtime/runtime-context-adapter';
import type { RuntimeGatewayAdapter } from '@/services/runtime/runtime-gateway-adapter';
import type { RuntimeMemoryAdapter } from '@/services/runtime/runtime-memory-adapter';
import type { RuntimePipelineAdapter } from '@/services/runtime/runtime-pipeline-adapter';
import type { RuntimePromptAdapter } from '@/services/runtime/runtime-prompt-adapter';
import type { RuntimeToolAdapter } from '@/services/runtime/runtime-tool-adapter';
import type {
  RuntimeValidationComponentCheck,
  RuntimeValidationReport,
  RuntimeValidatorDependencies,
  RuntimeValidatorOptions,
  RuntimeValidatorSnapshot,
  SerializedRuntimeValidationReport,
  SerializedRuntimeValidatorSnapshot,
} from '@/services/runtime/runtime-validator-types';

const ADAPTER_METHODS = {
  context: ['build', 'preview', 'validate', 'serialize', 'reset'],
  memory: ['read', 'write', 'search', 'delete', 'serialize', 'reset'],
  prompt: ['compile', 'validate', 'preview', 'serialize', 'reset'],
  pipeline: ['execute', 'validate', 'serialize', 'reset', 'resolveTrace'],
  tool: ['execute', 'validate', 'listTools', 'hasTool', 'serialize', 'reset'],
  gateway: ['complete', 'stream', 'models', 'health', 'serialize', 'reset'],
} as const;

function hasMethod(value: unknown, method: string): boolean {
  return Boolean(value) && typeof (value as Record<string, unknown>)[method] === 'function';
}

function checkRequiredMethods(
  component: RuntimeValidationComponentCheck['component'],
  target: unknown,
  methods: readonly string[],
): RuntimeValidationComponentCheck {
  const errors: string[] = [];

  if (!target || typeof target !== 'object') {
    return {
      component,
      ready: false,
      message: null,
      errors: ['component is not configured'],
    };
  }

  for (const method of methods) {
    if (!hasMethod(target, method)) {
      errors.push(`missing method: ${method}`);
    }
  }

  return {
    component,
    ready: errors.length === 0,
    message: errors.length === 0 ? 'wired' : null,
    errors,
  };
}

function runSafeSerialize(target: unknown, label: string): string[] {
  if (!hasMethod(target, 'serialize')) {
    return [`${label} serialize is unavailable`];
  }

  try {
    (target as { serialize: () => unknown }).serialize();
    return [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'serialize failed';
    return [`${label} serialize failed: ${message}`];
  }
}

function mergeCheck(
  base: RuntimeValidationComponentCheck,
  extraErrors: string[],
): RuntimeValidationComponentCheck {
  const errors = [...base.errors, ...extraErrors];

  return {
    component: base.component,
    ready: errors.length === 0,
    message: errors.length === 0 ? base.message : null,
    errors,
  };
}

/**
 * Readiness validator for runtime wiring. Performs structural checks only.
 */
export class RuntimeValidator {
  private lastReport: RuntimeValidationReport = buildRuntimeValidationReport(
    [],
    new Date().toISOString(),
  );
  private snapshot: RuntimeValidatorSnapshot = {
    lastOperation: null,
    lastValid: null,
    lastReadyCount: null,
    lastComponentCount: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(private readonly dependencies: RuntimeValidatorDependencies) {}

  validateRuntime(): RuntimeValidationReport {
    const components = [
      ...this.validateAdapters().components,
      this.validateFacade(),
      ...this.validateExecution().components,
      ...this.validateBridge().components,
    ];

    const report = buildRuntimeValidationReport(components, new Date().toISOString());
    this.storeReport('validateRuntime', report);
    return report;
  }

  validateBridge(): RuntimeValidationReport {
    const bridge = this.dependencies.bridge;
    const base = checkRequiredMethods('bridge', bridge, [
      'status',
      'serialize',
      'getFacade',
      'getGatewayAdapter',
      'getToolAdapter',
      'getPromptAdapter',
      'getMemoryAdapter',
      'getContextAdapter',
      'getPipelineAdapter',
      'getExecution',
    ]);

    const errors: string[] = [];

    try {
      bridge.status();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'status failed';
      errors.push(`status failed: ${message}`);
    }

    errors.push(...runSafeSerialize(bridge, 'bridge'));

    const wiringChecks: Array<[string, unknown]> = [
      ['facade', bridge.getFacade()],
      ['gatewayAdapter', bridge.getGatewayAdapter()],
      ['toolAdapter', bridge.getToolAdapter()],
      ['promptAdapter', bridge.getPromptAdapter()],
      ['memoryAdapter', bridge.getMemoryAdapter()],
      ['contextAdapter', bridge.getContextAdapter()],
      ['pipelineAdapter', bridge.getPipelineAdapter()],
      ['execution', bridge.getExecution()],
    ];

    for (const [label, component] of wiringChecks) {
      if (!component) {
        errors.push(`${label} is not wired`);
      }
    }

    const report = buildRuntimeValidationReport(
      [mergeCheck(base, errors)],
      new Date().toISOString(),
    );
    this.storeReport('validateBridge', report);
    return report;
  }

  validateAdapters(): RuntimeValidationReport {
    const bridge = this.dependencies.bridge;
    const components: RuntimeValidationComponentCheck[] = [
      this.checkContextAdapter(bridge.getContextAdapter()),
      this.checkMemoryAdapter(bridge.getMemoryAdapter()),
      this.checkPromptAdapter(bridge.getPromptAdapter()),
      this.checkPipelineAdapter(bridge.getPipelineAdapter()),
      this.checkToolAdapter(bridge.getToolAdapter()),
      this.checkGatewayAdapter(bridge.getGatewayAdapter()),
    ];

    const report = buildRuntimeValidationReport(components, new Date().toISOString());
    this.storeReport('validateAdapters', report);
    return report;
  }

  validateExecution(): RuntimeValidationReport {
    const execution = this.dependencies.bridge.getExecution();
    const base = checkRequiredMethods('execution', execution, [
      'run',
      'validate',
      'report',
      'serialize',
      'reset',
    ]);

    const errors: string[] = [...runSafeSerialize(execution, 'execution')];

    try {
      const validation = execution.validate();
      if (
        !validation ||
        typeof validation.valid !== 'boolean' ||
        !Array.isArray(validation.errors)
      ) {
        errors.push('validate() did not return a validation view');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'validate failed';
      errors.push(`validate failed: ${message}`);
    }

    try {
      execution.report();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'report failed';
      errors.push(`report failed: ${message}`);
    }

    const report = buildRuntimeValidationReport(
      [mergeCheck(base, errors)],
      new Date().toISOString(),
    );
    this.storeReport('validateExecution', report);
    return report;
  }

  report(): SerializedRuntimeValidationReport {
    return serializeRuntimeValidationReport(this.lastReport);
  }

  serialize(): SerializedRuntimeValidatorSnapshot {
    return serializeRuntimeValidatorSnapshot(this.snapshot);
  }

  reset(): void {
    this.lastReport = buildRuntimeValidationReport([], new Date().toISOString());
    this.snapshot = {
      lastOperation: null,
      lastValid: null,
      lastReadyCount: null,
      lastComponentCount: null,
      updatedAt: new Date().toISOString(),
    };
  }

  private validateFacade(): RuntimeValidationComponentCheck {
    const facade = this.dependencies.bridge.getFacade();
    const base = checkRequiredMethods('facade', facade, [
      'status',
      'report',
      'serialize',
      'reset',
      'getRunner',
      'executeRoadmap',
      'executeSprint',
    ]);

    const errors: string[] = [...runSafeSerialize(facade, 'facade')];

    try {
      facade.status();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'status failed';
      errors.push(`status failed: ${message}`);
    }

    try {
      if (!facade.getRunner()) {
        errors.push('runner is not wired');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'runner access failed';
      errors.push(`runner access failed: ${message}`);
    }

    return mergeCheck(base, errors);
  }

  private checkContextAdapter(adapter: RuntimeContextAdapter): RuntimeValidationComponentCheck {
    const base = checkRequiredMethods('context', adapter, ADAPTER_METHODS.context);
    const errors = [...runSafeSerialize(adapter, 'contextAdapter')];

    try {
      const validation = adapter.validate({} as never);
      if (!validation || typeof validation.valid !== 'boolean') {
        errors.push('validate() did not return a validation view');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'validate failed';
      errors.push(`validate failed: ${message}`);
    }

    return mergeCheck(base, errors);
  }

  private checkMemoryAdapter(adapter: RuntimeMemoryAdapter): RuntimeValidationComponentCheck {
    return mergeCheck(
      checkRequiredMethods('memory', adapter, ADAPTER_METHODS.memory),
      runSafeSerialize(adapter, 'memoryAdapter'),
    );
  }

  private checkPromptAdapter(adapter: RuntimePromptAdapter): RuntimeValidationComponentCheck {
    const base = checkRequiredMethods('prompt', adapter, ADAPTER_METHODS.prompt);
    const errors = [...runSafeSerialize(adapter, 'promptAdapter')];

    try {
      const validation = adapter.validate({} as never);
      if (!validation || typeof validation.valid !== 'boolean') {
        errors.push('validate() did not return a validation view');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'validate failed';
      errors.push(`validate failed: ${message}`);
    }

    return mergeCheck(base, errors);
  }

  private checkPipelineAdapter(adapter: RuntimePipelineAdapter): RuntimeValidationComponentCheck {
    const base = checkRequiredMethods('pipeline', adapter, ADAPTER_METHODS.pipeline);
    const errors = [...runSafeSerialize(adapter, 'pipelineAdapter')];

    try {
      const validation = adapter.validate({} as never);
      if (!validation || typeof validation.valid !== 'boolean') {
        errors.push('validate() did not return a validation view');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'validate failed';
      errors.push(`validate failed: ${message}`);
    }

    return mergeCheck(base, errors);
  }

  private checkToolAdapter(adapter: RuntimeToolAdapter): RuntimeValidationComponentCheck {
    const base = checkRequiredMethods('tool', adapter, ADAPTER_METHODS.tool);
    const errors = [...runSafeSerialize(adapter, 'toolAdapter')];

    try {
      const listed = adapter.listTools();
      if (!listed || !Array.isArray(listed.tools)) {
        errors.push('listTools() did not return tools array');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'listTools failed';
      errors.push(`listTools failed: ${message}`);
    }

    return mergeCheck(base, errors);
  }

  private checkGatewayAdapter(adapter: RuntimeGatewayAdapter): RuntimeValidationComponentCheck {
    const base = checkRequiredMethods('gateway', adapter, ADAPTER_METHODS.gateway);
    const errors = [...runSafeSerialize(adapter, 'gatewayAdapter')];

    return mergeCheck(base, errors);
  }

  private storeReport(
    operation: RuntimeValidatorSnapshot['lastOperation'],
    report: RuntimeValidationReport,
  ): void {
    this.lastReport = report;
    this.snapshot = {
      lastOperation: operation,
      lastValid: report.valid,
      lastReadyCount: report.readyCount,
      lastComponentCount: report.componentCount,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeValidator(options?: RuntimeValidatorOptions): RuntimeValidator {
  const bridge = options?.dependencies?.bridge ?? options?.bridge;

  if (!bridge) {
    throw new RuntimeValidatorConfigurationError('bridge is required for runtime validator');
  }

  return new RuntimeValidator({ bridge });
}

/** Default dev/test singleton. Requires explicit bridge wiring before use. */
export const runtimeValidator = {
  create: createRuntimeValidator,
};
