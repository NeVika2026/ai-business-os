import type {
  OrchestratorProvider,
  OrchestratorRuntime,
} from '@/services/runtime/orchestrator/engine/runtime-orchestrator-types';
import type { UUID } from '@/types/runtime/dto';

export class MockRuntimeOrchestratorProvider implements OrchestratorProvider {
  private readonly runtimes = new Map<UUID, OrchestratorRuntime>();

  save(runtime: OrchestratorRuntime): void {
    this.runtimes.set(runtime.runId, runtime);
  }

  get(runId: UUID): OrchestratorRuntime | null {
    return this.runtimes.get(runId) ?? null;
  }

  update(runtime: OrchestratorRuntime): void {
    this.runtimes.set(runtime.runId, runtime);
  }

  reset(): void {
    this.runtimes.clear();
  }
}

export function createMockRuntimeOrchestratorProvider(): MockRuntimeOrchestratorProvider {
  return new MockRuntimeOrchestratorProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockRuntimeOrchestratorProvider = createMockRuntimeOrchestratorProvider();
