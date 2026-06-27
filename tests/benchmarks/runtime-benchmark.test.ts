import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';
import { createProductionToolRegistry } from '@/services/runtime/tools/tool-registry';
import { createToolExecutor } from '@/services/runtime/tools/executor/tool-executor-factory';
import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { setGatewayMockMode } from '@/services/runtime/gateway/registry';
import { createAutonomousWorker } from '@/services/automation/autonomous-worker';
import { createAutomationPlanner } from '@/services/automation/automation-planner';
import { buildContext } from '@/services/runtime/context/context-builder';
import { compilePrompt } from '@/services/runtime/prompt/prompt-compiler';
import { toCompilePromptInput, toGatewayRequest } from '@/services/runtime/pipeline';
import { resetGatewayRateLimits } from '@/services/runtime/gateway/gateway-rate-limiter';

import { createContextBuildRequest } from '../runtime/helpers';

function measure(label: string, fn: () => void | Promise<void>): Promise<number> {
  const startedAt = performance.now();
  const result = fn();
  if (result instanceof Promise) {
    return result.then(() => {
      const durationMs = performance.now() - startedAt;
      console.log(`[benchmark] ${label}: ${durationMs.toFixed(2)}ms`);
      return durationMs;
    });
  }

  const durationMs = performance.now() - startedAt;
  console.log(`[benchmark] ${label}: ${durationMs.toFixed(2)}ms`);
  return Promise.resolve(durationMs);
}

describe('Production benchmarks', () => {
  it('measures core runtime component latency', async () => {
    setGatewayMockMode(true);
    resetGatewayRateLimits();

    const bridgeLatency = await measure('runtime.bridge.create', () => {
      createRuntimeBridge({ instanceId: 'benchmark-bridge' });
    });
    assert.ok(bridgeLatency < 500);

    const plannerLatency = await measure('automation.planner.plan', () => {
      const planner = createAutomationPlanner({ instanceId: 'benchmark-planner' });
      planner.plan({
        roadmapId: 'bench-roadmap',
        roadmapTitle: 'Bench',
        tasks: [
          { id: 't1', title: 'Task', dependencies: [], status: 'pending', priority: 0, order: 0 },
        ],
      });
    });
    assert.ok(plannerLatency < 200);

    const workerLatency = await measure('automation.worker.start', () => {
      const worker = createAutonomousWorker({ instanceId: 'benchmark-worker', cwd: process.cwd() });
      worker.start({
        roadmap: {
          id: 'bench-roadmap',
          title: 'Bench',
          sprints: [{ id: 's1', code: 'S1', title: 'Sprint', skipLint: true, skipBuild: true }],
        },
      });
    });
    assert.ok(workerLatency < 200);

    const contextRequest = createContextBuildRequest();
    const contextPackage = buildContext(contextRequest);
    const promptRequest = compilePrompt(toCompilePromptInput(contextPackage));
    const gatewayRequest = toGatewayRequest(promptRequest, contextPackage);

    const gatewayLatency = await measure('gateway.complete', async () => {
      await aiGateway.complete(gatewayRequest);
    });
    assert.ok(gatewayLatency < 1000);

    const toolExecutor = createToolExecutor(createProductionToolRegistry());
    const toolLatency = await measure('tool.runtime.info', async () => {
      await toolExecutor.execute({
        call: {
          id: 'bench-tool',
          name: 'runtime.info',
          arguments: {},
          audit: {
            runId: gatewayRequest.trace.runId,
            employeeId: 'bench-employee',
            organizationId: gatewayRequest.scope.organizationId,
            requestedAt: new Date().toISOString(),
          },
        },
        scope: gatewayRequest.scope,
        trace: gatewayRequest.trace,
        employee: {
          id: 'bench-employee',
          roleTitle: 'Bench',
          permissions: {},
          enabledTools: ['runtime.info'],
        },
      });
    });
    assert.ok(toolLatency < 500);

    const memoryUsageMb = process.memoryUsage().heapUsed / (1024 * 1024);
    console.log(`[benchmark] memory.heapUsed: ${memoryUsageMb.toFixed(2)}MB`);
    assert.ok(memoryUsageMb < 512);
  });
});
