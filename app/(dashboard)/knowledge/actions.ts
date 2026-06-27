'use server';

import { revalidatePath } from 'next/cache';

import type { KnowledgeImportStatus, KnowledgeSourceType } from '@/types/knowledge';
import {
  KNOWLEDGE_IMPORT_STATUSES,
  KNOWLEDGE_SOURCE_TYPES,
  mapFormTypeToDbType,
} from '@/types/knowledge';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

function getOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseSourceType(value: FormDataEntryValue | null): KnowledgeSourceType {
  if (typeof value !== 'string') {
    return 'manual';
  }

  return mapFormTypeToDbType(value);
}

function parseImportStatus(value: FormDataEntryValue | null): KnowledgeImportStatus {
  if (
    typeof value === 'string' &&
    KNOWLEDGE_IMPORT_STATUSES.includes(value as KnowledgeImportStatus)
  ) {
    return value as KnowledgeImportStatus;
  }

  return 'pending';
}

function buildMetadata(formData: FormData) {
  const filename =
    getOptionalText(formData.get('filename')) ?? getOptionalText(formData.get('existing_filename'));
  const format = getOptionalText(formData.get('form_type'));

  const metadata: Record<string, string> = {};

  if (filename) {
    metadata.filename = filename;
  }

  if (format) {
    metadata.format = format;

    if (format === 'manual-md') {
      metadata.mime_type = 'text/markdown';
    } else if (format === 'manual') {
      metadata.mime_type = 'text/plain';
    }
  }

  return metadata;
}

export async function createKnowledgeSource(formData: FormData) {
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

  const title = getOptionalText(formData.get('title'));

  if (!title) {
    throw new Error('Title is required');
  }

  const type = parseSourceType(formData.get('type'));
  const sourceUri = getOptionalText(formData.get('source_uri'));

  if (!KNOWLEDGE_SOURCE_TYPES.includes(type)) {
    throw new Error('Invalid source type');
  }

  const { error } = await supabase.from('knowledge_sources').insert({
    organization_id: organizationId,
    title,
    type,
    source_uri: sourceUri,
    status: 'pending',
    metadata: buildMetadata(formData),
    content_hash: null,
    created_by: user.id,
  });

  if (error) {
    throw error;
  }

  revalidatePath('/knowledge');
  revalidatePath('/knowledge/sources');
}

export async function updateKnowledgeSource(formData: FormData) {
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

  const id = getOptionalText(formData.get('id'));

  if (!id) {
    throw new Error('Source id is required');
  }

  const title = getOptionalText(formData.get('title'));

  if (!title) {
    throw new Error('Title is required');
  }

  const type = parseSourceType(formData.get('type'));

  const { error } = await supabase
    .from('knowledge_sources')
    .update({
      title,
      type,
      source_uri: getOptionalText(formData.get('source_uri')),
      status: parseImportStatus(formData.get('status')),
      metadata: buildMetadata(formData),
      updated_by: user.id,
    })
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  revalidatePath('/knowledge');
  revalidatePath('/knowledge/sources');
  revalidatePath(`/knowledge/sources/${id}`);
}

export async function deleteKnowledgeSource(formData: FormData) {
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

  const id = getOptionalText(formData.get('id'));

  if (!id) {
    throw new Error('Source id is required');
  }

  const { error } = await supabase
    .from('knowledge_sources')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  revalidatePath('/knowledge');
  revalidatePath('/knowledge/sources');
}
