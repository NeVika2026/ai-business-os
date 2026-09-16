'use server';

import {
  ensureFactoryProject,
  loadFactoryArtifacts,
  loadLatestFactoryArtifact,
  type FactoryArtifact,
  type FactoryStage,
} from '@/lib/factory-chain/persistence';

export async function ensureFactoryProjectAction(input: {
  projectId?: string | null;
  seed: string;
  stage: FactoryStage;
}): Promise<{ projectId: string; created: boolean }> {
  const result = await ensureFactoryProject(input);
  return {
    projectId: result.projectId,
    created: result.created,
  };
}

export async function getLatestFactoryArtifactAction(
  projectId: string,
): Promise<FactoryArtifact | null> {
  return loadLatestFactoryArtifact(projectId);
}

export async function getFactoryArtifactsAction(
  projectId: string,
): Promise<FactoryArtifact[]> {
  return loadFactoryArtifacts(projectId);
}
