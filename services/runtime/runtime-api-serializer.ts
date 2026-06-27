import type {
  RuntimeApiReport,
  RuntimeApiSnapshot,
  RuntimeApiStatusView,
  SerializedRuntimeApiReport,
  SerializedRuntimeApiSnapshot,
  SerializedRuntimeApiStatus,
} from '@/services/runtime/runtime-api-types';

export function serializeRuntimeApiStatus(
  status: RuntimeApiStatusView,
): SerializedRuntimeApiStatus {
  return {
    bridgeMode: status.bridgeMode,
    agentStatus: status.agentStatus,
    facadeMode: status.facadeMode,
    facadeCoordinatorStatus: status.facadeCoordinatorStatus,
    executionRunId: status.executionRunId,
    executionStatus: status.executionStatus,
    validationValid: status.validationValid,
    updatedAt: status.updatedAt,
  };
}

export function serializeRuntimeApiReport(report: RuntimeApiReport): SerializedRuntimeApiReport {
  return {
    version: report.version,
    bridgeMode: report.bridgeMode,
    agentStatus: report.agentStatus,
    nextRecommendedAction: report.nextRecommendedAction,
    executionRunId: report.executionRunId,
    executionStatus: report.executionStatus,
    validationValid: report.validationValid,
    validationReadyCount: report.validationReadyCount,
    facadeMode: report.facadeMode,
    updatedAt: report.updatedAt,
  };
}

export function serializeRuntimeApiSnapshot(
  snapshot: RuntimeApiSnapshot,
  context: {
    version: string;
    bridgeMode: string;
    agentStatus: SerializedRuntimeApiSnapshot['agentStatus'];
    executionRunId: string | null;
    executionStatus: SerializedRuntimeApiSnapshot['executionStatus'];
    validationValid: boolean | null;
    facadeMode: SerializedRuntimeApiSnapshot['facadeMode'];
  },
): SerializedRuntimeApiSnapshot {
  return {
    version: context.version,
    bridgeMode: context.bridgeMode,
    agentStatus: context.agentStatus,
    executionRunId: context.executionRunId,
    executionStatus: context.executionStatus,
    validationValid: context.validationValid,
    facadeMode: context.facadeMode,
    updatedAt: snapshot.updatedAt,
  };
}
