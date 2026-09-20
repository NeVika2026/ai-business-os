'use server';

import { revalidatePath } from 'next/cache';

import type { KnowledgeImportStatus, KnowledgeSourceType } from '@/types/knowledge';
import {
  KNOWLEDGE_IMPORT_STATUSES,
  KNOWLEDGE_SOURCE_TYPES,
  mapFormTypeToDbType,
} from '@/types/knowledge';
import { createClient } from '@/services/supabase/server';
import { detectKnowledgeFileType } from '@/services/knowledge/file-extraction';
import { failUploadedKnowledge, persistUploadedKnowledge } from '@/services/knowledge/persist-upload';
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


export type PrepareKnowledgeUploadInput = {
  filename: string;
  mimeType?: string | null;
  sizeBytes: number;
  contentHash: string;
  projectId?: string | null;
};

export type PrepareKnowledgeUploadResult =
  | {
      status: 'ready';
      sourceId: string;
      storagePath: string;
      sourceType: KnowledgeSourceType;
    }
  | {
      status: 'duplicate';
      sourceId: string;
      title: string;
      importStatus: KnowledgeImportStatus;
    };

export type ProcessKnowledgeUploadResult =
  | {
      status: 'completed';
      sourceId: string;
      documentCount: number;
      chunkCount: number;
    }
  | {
      status: 'failed';
      sourceId: string;
      message: string;
    };

const MAX_KNOWLEDGE_UPLOAD_BYTES = 100 * 1024 * 1024;

function safeStorageFilename(filename: string): string {
  const cleaned = filename
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return (cleaned || 'knowledge-file').slice(-180);
}

function sourceTitleFromFilename(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').trim() || 'Документ';
}

function normalizeMimeType(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

export async function prepareKnowledgeUpload(
  input: PrepareKnowledgeUploadInput,
): Promise<PrepareKnowledgeUploadResult> {
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

  const filename = input.filename?.trim();
  if (!filename) {
    throw new Error('Имя файла обязательно.');
  }

  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new Error('Файл пуст.');
  }

  if (input.sizeBytes > MAX_KNOWLEDGE_UPLOAD_BYTES) {
    throw new Error('Файл больше 100 МБ. Разделите его на несколько частей.');
  }

  const contentHash = input.contentHash?.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(contentHash)) {
    throw new Error('Некорректный SHA-256 файла.');
  }

  const mimeType = normalizeMimeType(input.mimeType);
  const sourceType = detectKnowledgeFileType(filename, mimeType);

  const { data: duplicate, error: duplicateError } = await supabase
    .from('knowledge_sources')
    .select('id, title, status')
    .eq('organization_id', organizationId)
    .eq('content_hash', contentHash)
    .neq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (duplicateError) {
    throw duplicateError;
  }

  if (duplicate) {
    return {
      status: 'duplicate',
      sourceId: duplicate.id,
      title: duplicate.title,
      importStatus: duplicate.status as KnowledgeImportStatus,
    };
  }

  const projectId = input.projectId?.trim() || null;
  if (projectId) {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (projectError) {
      throw projectError;
    }
    if (!project) {
      throw new Error('Проект не найден.');
    }
  }

  const { data: source, error: sourceError } = await supabase
    .from('knowledge_sources')
    .insert({
      organization_id: organizationId,
      project_id: projectId,
      title: sourceTitleFromFilename(filename),
      type: sourceType,
      source_uri: null,
      status: 'pending',
      metadata: {
        filename,
        mime_type: mimeType,
        size_bytes: input.sizeBytes,
        format: 'auto-import',
      },
      content_hash: contentHash,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (sourceError || !source) {
    throw sourceError ?? new Error('Не удалось создать источник знаний.');
  }

  const storagePath =
    organizationId + '/' + source.id + '/' + safeStorageFilename(filename);

  const { error: pathError } = await supabase
    .from('knowledge_sources')
    .update({ source_uri: storagePath })
    .eq('id', source.id)
    .eq('organization_id', organizationId);

  if (pathError) {
    throw pathError;
  }

  revalidatePath('/knowledge');

  return {
    status: 'ready',
    sourceId: source.id,
    storagePath,
    sourceType,
  };
}

export async function processKnowledgeUpload(
  sourceId: string,
): Promise<ProcessKnowledgeUploadResult> {
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

  const { data: source, error } = await supabase
    .from('knowledge_sources')
    .select('id, source_uri, status, metadata, items_count, chunks_count')
    .eq('id', sourceId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!source) {
    throw new Error('Источник не найден.');
  }

  if (source.status === 'completed') {
    return {
      status: 'completed',
      sourceId,
      documentCount: source.items_count ?? 0,
      chunkCount: source.chunks_count ?? 0,
    };
  }

  const metadata = (source.metadata ?? {}) as {
    filename?: unknown;
    mime_type?: unknown;
  };
  const filename = typeof metadata.filename === 'string' ? metadata.filename : '';
  const mimeType = typeof metadata.mime_type === 'string' ? metadata.mime_type : null;

  if (!filename || !source.source_uri) {
    throw new Error('У источника отсутствует файл.');
  }

  try {
    const result = await persistUploadedKnowledge({
      supabase,
      organizationId,
      userId: user.id,
      sourceId,
      storagePath: source.source_uri,
      filename,
      mimeType,
    });

    revalidatePath('/knowledge');
    revalidatePath('/projects');

    return {
      status: 'completed',
      ...result,
    };
  } catch (processingError) {
    const message =
      processingError instanceof Error
        ? processingError.message
        : 'Не удалось обработать файл.';

    await failUploadedKnowledge({
      supabase,
      organizationId,
      sourceId,
      message,
    });

    revalidatePath('/knowledge');

    return {
      status: 'failed',
      sourceId,
      message,
    };
  }
}
