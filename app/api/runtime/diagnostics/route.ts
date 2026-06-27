import { NextResponse } from 'next/server';

import { checkAllProvidersHealth } from '@/services/runtime/gateway/health';
import { isGatewayMockMode } from '@/services/runtime/gateway/adapter-factory';
import { hasProviderCredentials } from '@/services/runtime/gateway/credential-resolver';
import { costTracker } from '@/services/runtime/observability/cost/cost-tracker';
import { runtimeBridge } from '@/services/runtime/runtime-bridge';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const gatewayHealth = await checkAllProvidersHealth();
    const observer = runtimeBridge.getObserver();

    return NextResponse.json({
      status: 'ok',
      gateway: {
        mockMode: isGatewayMockMode(),
        providers: gatewayHealth.map((entry) => ({
          code: entry.providerCode,
          ok: entry.ok,
          latencyMs: entry.latencyMs,
          message: entry.message ?? null,
          hasCredentials: hasProviderCredentials(entry.providerCode),
        })),
      },
      observability: {
        metrics: observer.metrics(),
        cost: costTracker.serialize(),
      },
      runtime: {
        bridgeMode: runtimeBridge.status().mode,
        observerInstanceId: observer.getInstanceId(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
