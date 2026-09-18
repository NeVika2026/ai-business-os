'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { trackProductTelemetry } from '@/lib/telemetry/product-telemetry';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadHomeUserContext } from '@/utils/home/home-loader';
import { PROJECT_TYPES, type ProjectType } from '@/utils/projects/project-types';

export type CreateProjectResult = {
  projectId: string;
};

function getOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseProjectType(value: FormDataEntryValue | null): ProjectType {
  if (typeof value === 'string' && (PROJECT_TYPES as readonly string[]).includes(value)) {
    return value as ProjectType;
  }

  return 'general';
}

export async function createProject(formData: FormData): Promise<CreateProjectResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const name = getOptionalText(formData.get('name'));

  if (!name) {
    throw new Error('Name is required');
  }

  const description = getOptionalText(formData.get('description'));
  const projectType = parseProjectType(formData.get('project_type'));

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      organization_id: organizationId,
      name,
      description,
      project_type: projectType,
      icon: getOptionalText(formData.get('icon')),
      color: getOptionalText(formData.get('color')),
      status: 'active',
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error || !project) {
    throw error ?? new Error('Failed to create project');
  }

  const context = await loadHomeUserContext(supabase);

  if (context) {
    runProjectLifecycle({
      projectId: project.id,
      name,
      description,
      declaredType: projectType,
      organizationId,
      userId: context.email,
    });

    trackProductTelemetry({
      projectId: project.id,
      event: 'PROJECT_CREATED',
      actor: `user:${context.email}`,
      payload: {
        projectType,
      },
    });
  }

  revalidatePath('/projects');
  revalidatePath(`/workspace/${project.id}`);

  return { projectId: project.id };
}


export type SaveProjectMemoryInput = {
  projectId: string;
  goals: string;
  audience: string;
  style: string;
  decisions: string;
  constraints: string;
};

export async function saveProjectMemoryAction(
  input: SaveProjectMemoryInput,
): Promise<{ ok: true; updatedAt: string } | { ok: false; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, message: 'Требуется авторизация.' };
    }

    const organizationId = await getCurrentOrganizationId(supabase);

    if (!organizationId) {
      return { ok: false, message: 'Организация не найдена.' };
    }

    const projectId = input.projectId.trim();

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) throw projectError;

    if (!project) {
      return { ok: false, message: 'Проект не найден.' };
    }

    const updatedAt = new Date().toISOString();
    const { error } = await supabase.from('events').insert({
      id: randomUUID(),
      organization_id: organizationId,
      type: 'factory_project_memory_updated',
      source: 'factory',
      actor_type: 'user',
      actor_id: user.id,
      payload: {
        project_id: projectId,
        title: 'Память проекта обновлена',
        goals: input.goals.trim(),
        audience: input.audience.trim(),
        style: input.style.trim(),
        decisions: input.decisions.trim(),
        constraints: input.constraints.trim(),
      },
      metadata: {
        project_id: projectId,
        factory_memory: true,
      },
      correlation_id: projectId,
      created_at: updatedAt,
    });

    if (error) throw error;

    await supabase
      .from('projects')
      .update({
        updated_by: user.id,
        updated_at: updatedAt,
      })
      .eq('organization_id', organizationId)
      .eq('id', projectId);

    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);

    return { ok: true, updatedAt };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Не удалось сохранить память проекта.',
    };
  }
}
