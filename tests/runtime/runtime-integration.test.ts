import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';
import { buildContext } from '@/services/runtime/context/context-builder';
import { toCompilePromptInput } from '@/services/runtime/pipeline';

import {
  createAgentExecution,
  createContextBuildRequest,
  createMemoryReadRequest,
  createRoadmapInput,
  createRuntimeContext,
  createSprintInput,
  TEST_RUN_ID,
} from './helpers';

describe('Runtime integration', () => {
  it('wires bridge, api, facade, adapters, validator, and lifecycle methods', async () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-integration-main',
      orchestrationOnly: true,
    });

    const api = bridge.getApi();
    const facade = bridge.getFacade();
    const validator = bridge.getValidator();

    assert.ok(bridge.getContextAdapter());
    assert.ok(bridge.getMemoryAdapter());
    assert.ok(bridge.getPromptAdapter());
    assert.ok(bridge.getPipelineAdapter());
    assert.ok(bridge.getToolAdapter());
    assert.ok(bridge.getGatewayAdapter());
    assert.ok(bridge.getExecution());
    assert.ok(facade);

    const runtimeValidation = validator.validateRuntime();
    assert.equal(runtimeValidation.valid, true, runtimeValidation.errors.join('; '));

    const apiValidation = api.validate();
    assert.equal(apiValidation.valid, true, apiValidation.errors.join('; '));

    const orchestrationResult = await bridge.executeAgent(createAgentExecution(), {
      useLegacyPipeline: false,
    });
    assert.equal(orchestrationResult.status, 'completed');
    assert.equal(orchestrationResult.output?.orchestration, true);

    bridge.reset();

    const fullResult = await api.execute({
      execution: createAgentExecution({
        input: {
          action: 'summarize_leads',
          payload: {
            trace: {
              runId: 'run000002-0000-4000-8000-000000000002',
              correlationId: 'corr00002-0000-4000-8000-000000000002',
              traceId: 'trace0002-0000-4000-8000-000000000002',
            },
          },
        },
      }),
      useFullExecution: true,
      useLegacyPipeline: false,
    });
    assert.equal(fullResult.status, 'completed');

    const legacyResult = await bridge.executeAgent(
      createAgentExecution({
        input: {
          action: 'summarize_leads',
          payload: {
            trace: {
              runId: 'run000003-0000-4000-8000-000000000003',
              correlationId: 'corr00003-0000-4000-8000-000000000003',
              traceId: 'trace0003-0000-4000-8000-000000000003',
            },
          },
        },
      }),
      { useLegacyPipeline: true },
    );
    assert.equal(legacyResult.status, 'completed');

    const bridgeStatus = bridge.status();
    assert.equal(bridgeStatus.mode, 'agent');
    assert.equal(bridgeStatus.agentStatus, 'completed');

    const bridgeReport = bridge.report();
    assert.equal(bridgeReport.mode, 'agent');
    assert.ok(bridgeReport.facadeReport);

    const bridgeSnapshot = bridge.serialize();
    assert.equal(bridgeSnapshot.mode, 'agent');
    assert.ok(bridgeSnapshot.updatedAt);

    const apiStatus = api.status();
    assert.equal(apiStatus.agentStatus, 'completed');
    assert.ok(apiStatus.updatedAt);

    const apiReport = api.report();
    assert.equal(apiReport.agentStatus, 'completed');
    assert.ok(apiReport.updatedAt);

    const apiSnapshot = api.serialize();
    assert.equal(apiSnapshot.executionStatus, 'completed');
    assert.ok(apiSnapshot.updatedAt);

    const facadeStatus = facade.status();
    assert.ok(facadeStatus.mode);

    const contextAdapter = bridge.getContextAdapter();
    const contextRequest = createContextBuildRequest();
    const contextValidation = contextAdapter.validate(contextRequest);
    assert.equal(contextValidation.valid, true);
    const contextPackage = contextAdapter.build(contextRequest);
    assert.equal(contextPackage.organizationId, contextRequest.scope.organizationId);
    assert.equal(contextPackage.runId, TEST_RUN_ID);

    const memoryAdapter = bridge.getMemoryAdapter();
    const memoryPackage = memoryAdapter.read(createMemoryReadRequest());
    assert.ok(memoryPackage.entryCount > 0);
    const memorySearch = memoryAdapter.search({ query: 'campaign' });
    assert.ok(memorySearch.entryCount >= 0);

    const promptAdapter = bridge.getPromptAdapter();
    const compileInput = toCompilePromptInput(buildContext(contextRequest));
    const promptValidation = promptAdapter.validate(compileInput);
    assert.equal(promptValidation.valid, true);
    const promptRequest = promptAdapter.compile(compileInput);
    assert.ok(promptRequest.messages.length > 0);

    api.reset();
    bridge.reset();

    const resetStatus = bridge.status();
    assert.equal(resetStatus.mode, 'idle');
    assert.equal(resetStatus.agentStatus, null);
  });

  it('executes roadmap and sprint through bridge and facade', () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-integration-roadmap-inline',
      orchestrationOnly: true,
    });

    const runtimeContext = createRuntimeContext();
    const roadmap = createRoadmapInput();

    const roadmapResult = bridge.executeRoadmap({ roadmap, runtimeContext, skipRuntime: true });
    assert.equal(roadmapResult.roadmapId, roadmap.id);
    assert.ok(roadmapResult.sprintsExecuted >= 0);

    bridge.reset();

    const sprintResult = bridge.executeSprint({
      sprint: createSprintInput(),
      runtimeContext: createRuntimeContext({
        runId: 'run000004-0000-4000-8000-000000000004',
        traceId: 'trace0004-0000-4000-8000-000000000004',
      }),
      skipRuntime: true,
    });
    assert.equal(sprintResult.sprintId, createSprintInput().id);
    assert.ok(sprintResult.phase);
  });
});
