import type {
  RoadmapSessionProvider,
  RoadmapSessionRecord,
} from '@/services/runtime/orchestrator/session/roadmap-session-types';

export class MockRoadmapSessionProvider implements RoadmapSessionProvider {
  private readonly records = new Map<string, RoadmapSessionRecord>();

  save(record: RoadmapSessionRecord): void {
    this.records.set(record.roadmapId, record);
  }

  update(record: RoadmapSessionRecord): void {
    this.records.set(record.roadmapId, record);
  }

  get(roadmapId: string): RoadmapSessionRecord | null {
    return this.records.get(roadmapId) ?? null;
  }

  reset(): void {
    this.records.clear();
  }
}

export function createMockRoadmapSessionProvider(): MockRoadmapSessionProvider {
  return new MockRoadmapSessionProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockRoadmapSessionProvider = createMockRoadmapSessionProvider();
