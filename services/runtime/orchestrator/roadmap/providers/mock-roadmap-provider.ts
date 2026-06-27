import type {
  RoadmapCatalogEntry,
  RoadmapProvider,
} from '@/services/runtime/orchestrator/roadmap/roadmap-types';

export class MockRoadmapProvider implements RoadmapProvider {
  private readonly entries = new Map<string, RoadmapCatalogEntry>();

  save(entry: RoadmapCatalogEntry): void {
    this.entries.set(entry.roadmapId, entry);
  }

  get(roadmapId: string): RoadmapCatalogEntry | null {
    return this.entries.get(roadmapId) ?? null;
  }

  list(): RoadmapCatalogEntry[] {
    return [...this.entries.values()];
  }

  reset(): void {
    this.entries.clear();
  }
}

export function createMockRoadmapProvider(): MockRoadmapProvider {
  return new MockRoadmapProvider();
}

/** Shared in-memory catalog for local dev and tests. */
export const mockRoadmapProvider = createMockRoadmapProvider();
