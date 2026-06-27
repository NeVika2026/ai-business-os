import { createMemoryService } from '@/services/memory/memory-service';
import { checkAllProvidersHealth } from '@/services/runtime/gateway/health';
import { listProviderCodes } from '@/services/runtime/gateway/registry';
import { getCapabilitiesRegistry } from '@/services/runtime/gateway/capabilities';
import { listExecutionHistory } from '@/services/runtime/execution/checkpoint-store';
import { BaseToolHandler } from '@/services/runtime/tools/handlers/base-handler';
import type { ToolHandlerContext } from '@/services/runtime/tools/tool-types';

export class MemorySearchHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    const limit = typeof args.limit === 'number' && args.limit > 0 ? Math.min(args.limit, 20) : 5;

    const service = createMemoryService({ instanceId: `tool-memory-${ctx.organizationId}` });
    const results = query ? service.search(query).facts.slice(0, limit) : [];

    return {
      facts: results.map((entry) => ({
        id: entry.fact.id,
        text: entry.fact.text,
        score: entry.score,
      })),
      count: results.length,
    };
  }
}

export class GatewayHealthHandler extends BaseToolHandler {
  async execute(
    _args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    void ctx;
    const entries = await checkAllProvidersHealth();
    return {
      ok: entries.every((entry) => entry.ok),
      providers: entries.map((entry) => ({
        code: entry.providerCode,
        ok: entry.ok,
        latencyMs: entry.latencyMs,
        message: entry.message ?? null,
      })),
    };
  }
}

export class GatewayModelsHandler extends BaseToolHandler {
  async execute(
    _args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    void ctx;
    const registry = getCapabilitiesRegistry();
    const models: Array<{ providerCode: string; modelCode: string }> = [];

    for (const providerCode of listProviderCodes()) {
      const providerModels = registry[providerCode] ?? {};
      for (const modelCode of Object.keys(providerModels)) {
        models.push({ providerCode, modelCode });
      }
    }

    return { models, count: models.length };
  }
}

export class DiagnosticsRuntimeHandler extends BaseToolHandler {
  async execute(
    _args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    const history = listExecutionHistory(ctx.organizationId);
    return {
      organizationId: ctx.organizationId,
      runId: ctx.runId,
      executionHistoryCount: history.length,
      recentExecutions: history.slice(0, 5),
    };
  }
}

export class HealthCheckHandler extends BaseToolHandler {
  async execute(
    _args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    void ctx;
    const gateway = await checkAllProvidersHealth();
    return {
      status: gateway.every((entry) => entry.ok) ? 'healthy' : 'degraded',
      checkedAt: new Date().toISOString(),
      components: {
        gateway: gateway.every((entry) => entry.ok),
      },
    };
  }
}

export class AutomationStatusHandler extends BaseToolHandler {
  async execute(
    _args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    return {
      runId: ctx.runId,
      organizationId: ctx.organizationId,
      automationReady: true,
      message: 'Autonomous worker available for roadmap execution',
    };
  }
}

export const memorySearchHandler = new MemorySearchHandler();
export const gatewayHealthHandler = new GatewayHealthHandler();
export const gatewayModelsHandler = new GatewayModelsHandler();
export const diagnosticsRuntimeHandler = new DiagnosticsRuntimeHandler();
export const healthCheckHandler = new HealthCheckHandler();
export const automationStatusHandler = new AutomationStatusHandler();
