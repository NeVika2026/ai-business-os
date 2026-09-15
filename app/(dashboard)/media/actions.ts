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
