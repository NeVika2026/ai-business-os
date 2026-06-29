'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { PROJECT_TYPES, type ProjectType } from '@/utils/projects/project-types';

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

export async function createProject(formData: FormData) {
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

  const { error } = await supabase.from('projects').insert({
    organization_id: organizationId,
    name,
    description: getOptionalText(formData.get('description')),
    project_type: parseProjectType(formData.get('project_type')),
    icon: getOptionalText(formData.get('icon')),
    color: getOptionalText(formData.get('color')),
    status: 'active',
    created_by: user.id,
  });

  if (error) {
    throw error;
  }

  revalidatePath('/projects');
}
