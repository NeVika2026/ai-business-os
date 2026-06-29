import type { SupabaseClient } from '@supabase/supabase-js';

import type { HomeGoalId } from '@/utils/home/home-types';
import { SPRINT_RUNTIME_GOAL } from '@/utils/osa/runtime-bridge-policy';

export const FIND_CLIENTS_PROJECT = {
  name: 'Client Growth',
  description: 'Client acquisition plans, outreach, and follow-up.',
  project_type: 'crm' as const,
  icon: '🎯',
};

export function resolveGoalProjectName(goalId: HomeGoalId): string | null {
  if (goalId === SPRINT_RUNTIME_GOAL) {
    return FIND_CLIENTS_PROJECT.name;
  }

  return null;
}

export async function ensureGoalProject(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  goalId: HomeGoalId,
): Promise<string | null> {
  if (goalId !== SPRINT_RUNTIME_GOAL) {
    return null;
  }

  const { data: existing, error: existingError } = await supabase
    .from('projects')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('name', FIND_CLIENTS_PROJECT.name)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error: createError } = await supabase
    .from('projects')
    .insert({
      organization_id: organizationId,
      name: FIND_CLIENTS_PROJECT.name,
      description: FIND_CLIENTS_PROJECT.description,
      project_type: FIND_CLIENTS_PROJECT.project_type,
      icon: FIND_CLIENTS_PROJECT.icon,
      status: 'active',
      created_by: userId,
    })
    .select('id')
    .single();

  if (createError) {
    throw createError;
  }

  return created.id;
}
