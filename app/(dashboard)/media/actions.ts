'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

export type MediaProjectOption = {
  id: string;
  name: string;
};

export async function listMediaProjectOptionsAction(): Promise<MediaProjectOption[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('id,name')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((project) => ({
    id: String(project.id),
    name: String(project.name ?? 'Без названия'),
  }));
}

export async function attachMediaAssetToProjectAction(
  assetId: string,
  projectId: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return { ok: false, message: 'Организация не найдена.' };
  }

  const { data: asset, error: assetError } = await supabase
    .from('media_assets')
    .select('id,organization_id')
    .eq('id', assetId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (assetError || !asset) {
    return { ok: false, message: 'Медиафайл не найден.' };
  }

  if (projectId) {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (projectError || !project) {
      return { ok: false, message: 'Проект не найден.' };
    }
  }

  const { error } = await supabase
    .from('media_assets')
    .update({ project_id: projectId })
    .eq('id', assetId)
    .eq('organization_id', organizationId);

  if (error) {
    return { ok: false, message: 'Не удалось обновить проект медиафайла.' };
  }

  revalidatePath('/media');
  return { ok: true };
}


const MEDIA_BUCKET = 'media-assets';
const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
const SIGNED_UPLOAD_TTL_SECONDS = 60 * 60 * 24 * 7;

const MEDIA_MIME_KIND: Record<string, 'image' | 'video' | 'audio'> = {
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/mp4': 'audio',
  'audio/webm': 'audio',
};

function sanitizeUploadName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(-120) || 'file';
}

export async function prepareMediaUploadAction(input: {
  fileName: string;
  contentType: string;
  byteSize: number;
  projectId?: string | null;
}) {
  const kind = MEDIA_MIME_KIND[input.contentType];
  if (!kind) {
    return { status: 'failed' as const, message: 'Этот формат файла пока не поддерживается.' };
  }

  if (!Number.isFinite(input.byteSize) || input.byteSize <= 0 || input.byteSize > MAX_UPLOAD_BYTES) {
    return { status: 'failed' as const, message: 'Файл должен быть не больше 250 МБ.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!user || !organizationId) {
    return { status: 'failed' as const, message: 'Нужно войти в Бизнес-завод.' };
  }

  let projectId: string | null = null;
  if (input.projectId?.trim()) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', input.projectId.trim())
      .eq('organization_id', organizationId)
      .maybeSingle();
    projectId = project?.id ? String(project.id) : null;
  }

  const assetId = crypto.randomUUID();
  const path =
    organizationId +
    '/uploads/' +
    kind +
    '/' +
    assetId +
    '-' +
    sanitizeUploadName(input.fileName);

  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);

  if (error || !data?.token) {
    return { status: 'failed' as const, message: 'Не удалось подготовить загрузку файла.' };
  }

  return {
    status: 'ready' as const,
    path,
    token: data.token,
    kind,
    assetId,
    projectId,
  };
}

export async function completeMediaUploadAction(input: {
  path: string;
  assetId: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  kind: 'image' | 'video' | 'audio';
  projectId?: string | null;
}) {
  const expectedKind = MEDIA_MIME_KIND[input.contentType];
  if (!expectedKind || expectedKind !== input.kind) {
    return { status: 'failed' as const, message: 'Тип файла не совпадает с загрузкой.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!user || !organizationId) {
    return { status: 'failed' as const, message: 'Нужно войти в Бизнес-завод.' };
  }

  if (!input.path.startsWith(organizationId + '/uploads/')) {
    return { status: 'failed' as const, message: 'Недопустимый путь файла.' };
  }

  let projectId: string | null = null;
  if (input.projectId?.trim()) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', input.projectId.trim())
      .eq('organization_id', organizationId)
      .maybeSingle();
    projectId = project?.id ? String(project.id) : null;
  }

  const { error: dbError } = await supabase.from('media_assets').upsert(
    {
      organization_id: organizationId,
      created_by: user.id,
      project_id: projectId,
      kind: input.kind,
      provider: 'upload',
      provider_asset_id: input.assetId,
      storage_bucket: MEDIA_BUCKET,
      storage_path: input.path,
      content_type: input.contentType,
      byte_size: input.byteSize,
      metadata: {
        source: 'device-upload',
        originalFileName: input.fileName,
      },
    },
    { onConflict: 'organization_id,provider,provider_asset_id' },
  );

  if (dbError) {
    return { status: 'failed' as const, message: 'Файл загружен, но не добавлен в медиатеку.' };
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(input.path, SIGNED_UPLOAD_TTL_SECONDS);

  if (signedError || !signed?.signedUrl) {
    return { status: 'failed' as const, message: 'Файл сохранён, но не удалось открыть его.' };
  }

  revalidatePath('/media');

  return {
    status: 'completed' as const,
    url: signed.signedUrl,
    path: input.path,
    kind: input.kind,
    assetId: input.assetId,
  };
}
