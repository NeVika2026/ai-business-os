import { refreshPersistedMediaUrl } from '@/services/media/persist-provider-asset';
import type { createClient } from '@/services/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type MediaLibraryItem = {
  id: string;
  kind: 'video' | 'image' | 'audio';
  provider: string;
  providerAssetId: string | null;
  storagePath: string;
  contentType: string | null;
  byteSize: number | null;
  durationSeconds: number | null;
  createdAt: string;
  metadata: Record<string, unknown>;
  signedUrl: string | null;
};

export type MediaLibraryData = {
  items: MediaLibraryItem[];
  total: number;
  counts: {
    video: number;
    image: number;
    audio: number;
  };
};

function asKind(value: unknown): MediaLibraryItem['kind'] {
  return value === 'image' || value === 'audio' ? value : 'video';
}

function asMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function loadMediaLibrary(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<MediaLibraryData> {
  const { data, error } = await supabase
    .from('media_assets')
    .select(
      'id,kind,provider,provider_asset_id,storage_path,content_type,byte_size,duration_seconds,metadata,created_at',
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data) {
    return {
      items: [],
      total: 0,
      counts: { video: 0, image: 0, audio: 0 },
    };
  }

  const items = await Promise.all(
    data.map(async (row) => ({
      id: String(row.id),
      kind: asKind(row.kind),
      provider: String(row.provider ?? ''),
      providerAssetId:
        typeof row.provider_asset_id === 'string' ? row.provider_asset_id : null,
      storagePath: String(row.storage_path ?? ''),
      contentType: typeof row.content_type === 'string' ? row.content_type : null,
      byteSize: typeof row.byte_size === 'number' ? row.byte_size : null,
      durationSeconds:
        typeof row.duration_seconds === 'number' ? row.duration_seconds : null,
      createdAt: String(row.created_at ?? ''),
      metadata: asMetadata(row.metadata),
      signedUrl: row.storage_path
        ? await refreshPersistedMediaUrl(String(row.storage_path))
        : null,
    })),
  );

  return {
    items,
    total: items.length,
    counts: {
      video: items.filter((item) => item.kind === 'video').length,
      image: items.filter((item) => item.kind === 'image').length,
      audio: items.filter((item) => item.kind === 'audio').length,
    },
  };
}
