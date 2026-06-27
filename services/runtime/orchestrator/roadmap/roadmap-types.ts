import type { ISODateTime } from '@/types/runtime/dto';

export type RoadmapSprintStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'blocked';

export interface RoadmapSprintInput {
  id: string;
  title: string;
  code: string;
  description?: string;
  dependsOn?: string[];
  includeValidateStep?: boolean;
  includeCommitStep?: boolean;
  skipLint?: boolean;
  skipBuild?: boolean;
}

export interface RoadmapInput {
  id: string;
  title: string;
  sprints: RoadmapSprintInput[];
}

export interface RoadmapSprintPlan {
  sprintId: string;
  sprintCode: string;
  sprintTitle: string;
  planId: string;
  planTitle: string;
  stepIds: string[];
}

export interface RoadmapCatalogEntry {
  roadmapId: string;
  title: string;
  sprintCount: number;
  sprintCodes: string[];
  createdAt: ISODateTime;
}

export interface RoadmapProvider {
  save(entry: RoadmapCatalogEntry): void;
  get(roadmapId: string): RoadmapCatalogEntry | null;
  list(): RoadmapCatalogEntry[];
  reset?(): void;
}

export interface SprintCompileOptions {
  implementOutcome?: 'success' | 'failure';
  prefix?: string;
}
