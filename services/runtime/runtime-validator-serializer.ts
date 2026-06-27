import type {
  RuntimeValidationComponentCheck,
  RuntimeValidationReport,
  RuntimeValidatorSnapshot,
  SerializedRuntimeValidationReport,
  SerializedRuntimeValidatorSnapshot,
} from '@/services/runtime/runtime-validator-types';

export function serializeRuntimeValidationReport(
  report: RuntimeValidationReport,
): SerializedRuntimeValidationReport {
  return {
    valid: report.valid,
    checkedAt: report.checkedAt,
    componentCount: report.componentCount,
    readyCount: report.readyCount,
    adaptersValid: report.adaptersValid,
    bridgeValid: report.bridgeValid,
    executionValid: report.executionValid,
    facadeValid: report.facadeValid,
    errorCount: report.errors.length,
    errors: [...report.errors],
    components: report.components.map((component) => ({
      component: component.component,
      ready: component.ready,
      message: component.message,
      errorCount: component.errors.length,
      errors: [...component.errors],
    })),
  };
}

export function serializeRuntimeValidatorSnapshot(
  snapshot: RuntimeValidatorSnapshot,
): SerializedRuntimeValidatorSnapshot {
  return {
    lastOperation: snapshot.lastOperation,
    lastValid: snapshot.lastValid,
    lastReadyCount: snapshot.lastReadyCount,
    lastComponentCount: snapshot.lastComponentCount,
    updatedAt: snapshot.updatedAt,
  };
}

export function buildRuntimeValidationReport(
  components: RuntimeValidationComponentCheck[],
  checkedAt: string,
): RuntimeValidationReport {
  const adapterIds = new Set(['context', 'memory', 'prompt', 'pipeline', 'tool', 'gateway']);
  const adapterComponents = components.filter((component) => adapterIds.has(component.component));
  const bridgeComponent = components.find((component) => component.component === 'bridge');
  const executionComponent = components.find((component) => component.component === 'execution');
  const facadeComponent = components.find((component) => component.component === 'facade');

  const adaptersValid =
    adapterComponents.length === 6 && adapterComponents.every((item) => item.ready);
  const bridgeValid = bridgeComponent?.ready ?? false;
  const executionValid = executionComponent?.ready ?? false;
  const facadeValid = facadeComponent?.ready ?? false;
  const readyCount = components.filter((component) => component.ready).length;
  const errors = components.flatMap((component) =>
    component.errors.map((error) => `${component.component}: ${error}`),
  );

  return {
    valid: components.length > 0 && components.every((component) => component.ready),
    checkedAt,
    componentCount: components.length,
    readyCount,
    adaptersValid,
    bridgeValid,
    executionValid,
    facadeValid,
    errors,
    components,
  };
}
