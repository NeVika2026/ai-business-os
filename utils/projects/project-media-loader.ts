import { refreshPersistedMediaUrl } from '@/services/media/persist-provider-asset';
import type { createClient } from '@/services/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ProjectMediaItem = {
  id: string;
  kind: 'video' | 'image' | 'audio';
  title: string;
  provider: string;
  createdAt: string;
  signedUrl: string | null;
};

function asKind(value: unknown): ProjectMediaItem['kind'] {
  return value === 'image' || value === 'audio' ? value : 'video';
}

function resolveTitle(row: {
  kind: unknown;
  provider: unknown;
  metadata: unknown;
}): string {
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  const metadataTitle =
    typeof metadata.title === 'string' ? metadata.title.trim() : '';

  if (metadataTitle) return metadataTitle;

  const kind = asKind(row.kind);
  const provider = String(row.provider ?? '');

  if (provider === 'browser-export') return 'Финальный ролик';
  if (kind === 'image') return 'Изображение';
  if (kind === 'audio') return 'Озвучка';
  return 'Видео';
}

export async function loadProjectMedia(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string,
): Promise<ProjectMediaItem[]> {
  const { data, error } = await supabase
    .from('media_assets')
    .select('id,kind,provider,storage_path,metadata,created_at')
    .eq('organization_id', organizationId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error || !data) return [];

  return Promise.all(
    data.map(async (row) => ({
      id: String(row.id),
      kind: asKind(row.kind),
      title: resolveTitle(row),
      provider: String(row.provider ?? ''),
      createdAt: String(row.created_at ?? ''),
      signedUrl: row.storage_path
        ? await refreshPersistedMediaUrl(String(row.storage_path))
        : null,
    })),
  );
}
