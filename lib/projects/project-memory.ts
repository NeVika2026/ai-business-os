import type { SupabaseClient } from '@supabase/supabase-js';

export type ProjectMemory = {
  goals: string;
  audience: string;
  style: string;
  decisions: string;
  constraints: string;
  updatedAt: string | null;
};

export const EMPTY_PROJECT_MEMORY: ProjectMemory = {
  goals: '',
  audience: '',
  style: '',
  decisions: '',
  constraints: '',
  updatedAt: null,
};

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export async function loadProjectMemory(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string,
): Promise<ProjectMemory> {
  const { data, error } = await supabase
    .from('events')
    .select('payload, created_at')
    .eq('organization_id', organizationId)
    .eq('type', 'factory_project_memory_updated')
    .eq('source', 'factory')
    .eq('correlation_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return EMPTY_PROJECT_MEMORY;
  }

  const payload =
    data.payload && typeof data.payload === 'object'
      ? (data.payload as Record<string, unknown>)
      : {};

  return {
    goals: textValue(payload.goals),
    audience: textValue(payload.audience),
    style: textValue(payload.style),
    decisions: textValue(payload.decisions),
    constraints: textValue(payload.constraints),
    updatedAt: data.created_at ?? null,
  };
}
