'use server';

import { randomUUID } from 'node:crypto';

import {
  ensureFactoryProject,
  loadFactoryArtifacts,
  loadLatestFactoryArtifact,
  resolveFactoryIdentity,
  saveFactoryArtifact,
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


export async function saveFactoryArtifactAction(input: {
  projectId: string;
  stage: FactoryStage;
  title: string;
  content: string;
  sources?: Array<{ title: string; url: string; description?: string }>;
  metadata?: Record<string, unknown>;
}): Promise<FactoryArtifact> {
  return saveFactoryArtifact(input);
}


export async function getFactoryArtifactAction(
  projectId: string,
  artifactId: string,
): Promise<FactoryArtifact | null> {
  const artifacts = await loadFactoryArtifacts(projectId);
  return artifacts.find((artifact) => artifact.id === artifactId) ?? null;
}


export type FactoryBundleSnapshot = {
  prompt: string;
  approved: boolean;
  textTasks: Array<Record<string, unknown>>;
  jobs: Array<Record<string, unknown>>;
  savedAt: string;
};

export async function saveFactoryBundleSnapshotAction(input: {
  projectId: string;
  snapshot: Omit<FactoryBundleSnapshot, 'savedAt'>;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const projectId = input.projectId.trim();
  if (!projectId) return { ok: false, message: 'Проект не указан.' };

  try {
    const identity = await resolveFactoryIdentity();
    const { data: project, error: projectError } = await identity.supabase
      .from('projects')
      .select('id')
      .eq('organization_id', identity.organizationId)
      .eq('id', projectId)
      .maybeSingle();

    if (projectError || !project) {
      return { ok: false, message: 'Проект не найден.' };
    }

    const savedAt = new Date().toISOString();
    const { error } = await identity.supabase.from('events').insert({
      id: randomUUID(),
      organization_id: identity.organizationId,
      type: 'factory_bundle_snapshot',
      source: 'factory',
      actor_type: 'user',
      actor_id: identity.userId,
      payload: {
        project_id: projectId,
        snapshot: {
          ...input.snapshot,
          savedAt,
        },
      },
      metadata: {
        project_id: projectId,
        snapshot_kind: 'factory_bundle',
      },
      correlation_id: projectId,
      created_at: savedAt,
    });

    if (error) {
      return { ok: false, message: 'Не удалось сохранить состояние маршрута.' };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : 'Не удалось сохранить состояние маршрута.',
    };
  }
}

export async function loadLatestFactoryBundleSnapshotAction(
  projectId: string,
): Promise<FactoryBundleSnapshot | null> {
  const normalizedProjectId = projectId.trim();
  if (!normalizedProjectId) return null;

  try {
    const identity = await resolveFactoryIdentity();

    const { data: project, error: projectError } = await identity.supabase
      .from('projects')
      .select('id')
      .eq('organization_id', identity.organizationId)
      .eq('id', normalizedProjectId)
      .maybeSingle();

    if (projectError || !project) return null;

    const { data, error } = await identity.supabase
      .from('events')
      .select('payload,created_at')
      .eq('organization_id', identity.organizationId)
      .eq('source', 'factory')
      .eq('type', 'factory_bundle_snapshot')
      .eq('correlation_id', normalizedProjectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.payload || typeof data.payload !== 'object') return null;

    const payload = data.payload as Record<string, unknown>;
    const snapshot =
      payload.snapshot && typeof payload.snapshot === 'object'
        ? (payload.snapshot as Record<string, unknown>)
        : null;

    if (!snapshot) return null;

    return {
      prompt: typeof snapshot.prompt === 'string' ? snapshot.prompt : '',
      approved: Boolean(snapshot.approved),
      textTasks: Array.isArray(snapshot.textTasks)
        ? (snapshot.textTasks as Array<Record<string, unknown>>)
        : [],
      jobs: Array.isArray(snapshot.jobs)
        ? (snapshot.jobs as Array<Record<string, unknown>>)
        : [],
      savedAt:
        typeof snapshot.savedAt === 'string'
          ? snapshot.savedAt
          : String(data.created_at ?? ''),
    };
  } catch {
    return null;
  }
}
