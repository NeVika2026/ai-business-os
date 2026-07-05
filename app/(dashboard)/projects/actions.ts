'use server';

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
