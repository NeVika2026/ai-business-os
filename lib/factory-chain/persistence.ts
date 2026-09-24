import { randomUUID } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

export const FACTORY_STAGES = ['find', 'analyze', 'create', 'publish'] as const;
export type FactoryStage = (typeof FACTORY_STAGES)[number];

export type FactoryArtifactSource = {
  title: string;
  url: string;
  description?: string;
};

export type FactoryArtifact = {
  id: string;
  projectId: string;
  stage: FactoryStage;
  title: string;
  content: string;
  sources: FactoryArtifactSource[];
  metadata: Record<string, unknown>;
  createdAt: string;
};

type FactoryIdentity = {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
};

function projectNameFromSeed(seed: string): string {
  const normalized = seed.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Новый проект Бизнес-Завода';
  return normalized.length > 64 ? normalized.slice(0, 61).trimEnd() + '…' : normalized;
}

export async function resolveFactoryIdentity(): Promise<FactoryIdentity> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Требуется авторизация.');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Организация не найдена.');

  return {
    supabase,
    organizationId,
    userId: user.id,
  };
}

export async function ensureFactoryProject(input: {
  projectId?: string | null;
  seed: string;
  stage: FactoryStage;
}): Promise<{ projectId: string; created: boolean; identity: FactoryIdentity }> {
  const identity = await resolveFactoryIdentity();
  const requestedId = input.projectId?.trim();

  if (requestedId) {
    const { data, error } = await identity.supabase
      .from('projects')
      .select('id')
      .eq('organization_id', identity.organizationId)
      .eq('id', requestedId)
      .maybeSingle();

    if (error) throw error;
    if (data?.id) {
      return { projectId: data.id, created: false, identity };
    }
  }

  const name = projectNameFromSeed(input.seed);
  const { data: project, error } = await identity.supabase
    .from('projects')
    .insert({
      organization_id: identity.organizationId,
      name,
      description: input.seed.trim() || null,
      project_type: 'general',
      status: 'active',
      created_by: identity.userId,
      icon: '⚙️',
      color: '#69e4ee',
    })
    .select('id')
    .single();

  if (error || !project) {
    throw error ?? new Error('Не удалось создать проект.');
  }

  const now = new Date().toISOString();
  await identity.supabase.from('events').insert({
    id: randomUUID(),
    organization_id: identity.organizationId,
    type: 'factory_project_created',
    source: 'factory',
    actor_type: 'user',
    actor_id: identity.userId,
    payload: {
      project_id: project.id,
      stage: input.stage,
      title: 'Проект Бизнес-Завода создан',
      seed: input.seed.trim(),
    },
    metadata: {
      factory_stage: input.stage,
    },
    correlation_id: project.id,
    created_at: now,
  });

  return { projectId: project.id, created: true, identity };
}

export async function saveFactoryArtifact(input: {
  projectId: string;
  stage: FactoryStage;
  title: string;
  content: string;
  sources?: FactoryArtifactSource[];
  metadata?: Record<string, unknown>;
  identity?: FactoryIdentity;
}): Promise<FactoryArtifact> {
  const identity = input.identity ?? (await resolveFactoryIdentity());
  const createdAt = new Date().toISOString();
  const id = randomUUID();
  const sources = input.sources ?? [];
  const metadata = input.metadata ?? {};

  const { error } = await identity.supabase.from('events').insert({
    id,
    organization_id: identity.organizationId,
    type: 'factory_artifact_saved',
    source: 'factory',
    actor_type: 'user',
    actor_id: identity.userId,
    payload: {
      project_id: input.projectId,
      stage: input.stage,
      title: input.title,
      content: input.content,
      sources,
      metadata,
    },
    metadata: {
      project_id: input.projectId,
      factory_stage: input.stage,
    },
    correlation_id: input.projectId,
    created_at: createdAt,
  });

  if (error) throw error;

  await identity.supabase
    .from('projects')
    .update({
      updated_by: identity.userId,
      updated_at: createdAt,
    })
    .eq('organization_id', identity.organizationId)
    .eq('id', input.projectId);

  return {
    id,
    projectId: input.projectId,
    stage: input.stage,
    title: input.title,
    content: input.content,
    sources,
    metadata,
    createdAt,
  };
}

function isFactoryStage(value: unknown): value is FactoryStage {
  return typeof value === 'string' && (FACTORY_STAGES as readonly string[]).includes(value);
}

export function mapFactoryArtifactEvent(event: {
  id: string;
  payload: Record<string, unknown>;
  created_at: string;
}): FactoryArtifact | null {
  const projectId =
    typeof event.payload.project_id === 'string' ? event.payload.project_id : '';
  const stage = event.payload.stage;
  const title = typeof event.payload.title === 'string' ? event.payload.title : '';
  const content = typeof event.payload.content === 'string' ? event.payload.content : '';
  const rawSources = Array.isArray(event.payload.sources) ? event.payload.sources : [];
  const rawMetadata =
    event.payload.metadata && typeof event.payload.metadata === 'object'
      ? (event.payload.metadata as Record<string, unknown>)
      : {};

  if (!projectId || !isFactoryStage(stage) || !content) return null;

  const sources = rawSources.reduce<FactoryArtifactSource[]>((acc, source) => {
    if (!source || typeof source !== 'object') return acc;

    const item = source as Record<string, unknown>;
    const url = typeof item.url === 'string' ? item.url : '';
    if (!url) return acc;

    const mapped: FactoryArtifactSource = {
      title: typeof item.title === 'string' ? item.title : 'Источник',
      url,
    };

    if (typeof item.description === 'string') {
      mapped.description = item.description;
    }

    acc.push(mapped);
    return acc;
  }, []);

  return {
    id: event.id,
    projectId,
    stage,
    title: title || 'Результат Бизнес-Завода',
    content,
    sources,
    metadata: rawMetadata,
    createdAt: event.created_at,
  };
}

export async function loadFactoryArtifacts(projectId: string): Promise<FactoryArtifact[]> {
  const identity = await resolveFactoryIdentity();

  const { data: project, error: projectError } = await identity.supabase
    .from('projects')
    .select('id')
    .eq('organization_id', identity.organizationId)
    .eq('id', projectId)
    .maybeSingle();

  if (projectError) throw projectError;
  if (!project) return [];

  const { data, error } = await identity.supabase
    .from('events')
    .select('id, payload, created_at')
    .eq('organization_id', identity.organizationId)
    .eq('source', 'factory')
    .eq('type', 'factory_artifact_saved')
    .eq('correlation_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? [])
    .map((event) =>
      mapFactoryArtifactEvent({
        id: event.id,
        payload: (event.payload ?? {}) as Record<string, unknown>,
        created_at: event.created_at,
      }),
    )
    .filter((artifact): artifact is FactoryArtifact => Boolean(artifact));
}

export async function loadLatestFactoryArtifact(projectId: string): Promise<FactoryArtifact | null> {
  const artifacts = await loadFactoryArtifacts(projectId);
  return artifacts[0] ?? null;
}


export async function loadRecentFactoryArtifacts(limit = 40): Promise<FactoryArtifact[]> {
  const identity = await resolveFactoryIdentity();
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const { data, error } = await identity.supabase
    .from('events')
    .select('id, payload, created_at')
    .eq('organization_id', identity.organizationId)
    .eq('source', 'factory')
    .eq('type', 'factory_artifact_saved')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw error;

  return (data ?? [])
    .map((event) =>
      mapFactoryArtifactEvent({
        id: event.id,
        payload: (event.payload ?? {}) as Record<string, unknown>,
        created_at: event.created_at,
      }),
    )
    .filter((artifact): artifact is FactoryArtifact => Boolean(artifact));
}
