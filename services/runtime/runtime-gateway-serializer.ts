import type {
  RuntimeGatewaySnapshot,
  SerializedRuntimeGatewaySnapshot,
} from '@/services/runtime/runtime-gateway-types';

export function serializeRuntimeGatewaySnapshot(
  snapshot: RuntimeGatewaySnapshot,
): SerializedRuntimeGatewaySnapshot {
  return {
    lastOperation: snapshot.lastOperation,
    lastRunId: snapshot.lastRunId,
    lastModelId: snapshot.lastModelId,
    updatedAt: snapshot.updatedAt,
  };
}
