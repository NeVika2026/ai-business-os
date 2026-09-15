
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

const MEDIA_BUCKET = 'media-assets';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_ASSET_BYTES = 250 * 1024 * 1024;

type PersistProviderAssetInput = {
  sourceUrl: string;
  kind: 'video' | 'image' | 'audio';
  provider: 'runway' | 'elevenlabs';
  providerAssetId: string;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
};

export type PersistProviderAssetResult = {
  persisted: boolean;
  url: string;
  storagePath: string | null;
};

function extensionForContentType(contentType: string): string | null {
  const normalized = contentType.toLowerCase().split(';')[0]?.trim();

  switch (normalized) {
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/wav':
      return 'wav';
    case 'audio/mp4':
      return 'm4a';
    case 'audio/webm':
      return 'webm';
    default:
      return null;
  }
}

function sanitizeAssetId(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return normalized || crypto.randomUUID();
}

export async function persistProviderAsset(
  input: PersistProviderAssetInput,
): Promise<PersistProviderAssetResult> {
  const sourceUrl = input.sourceUrl.trim();

  if (!sourceUrl) {
    return { persisted: false, url: sourceUrl, storagePath: null };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const organizationId = await getCurrentOrganizationId(supabase);

    if (!user || !organizationId) {
      return { persisted: false, url: sourceUrl, storagePath: null };
    }

    const response = await fetch(sourceUrl, { cache: 'no-store' });

    if (!response.ok) {
      return { persisted: false, url: sourceUrl, storagePath: null };
    }

    const contentType = response.headers.get('content-type') || '';
    const extension = extensionForContentType(contentType);

    if (!extension) {
      return { persisted: false, url: sourceUrl, storagePath: null };
    }

    const contentLength = Number(response.headers.get('content-length') || 0);

    if (contentLength > MAX_ASSET_BYTES) {
      return { persisted: false, url: sourceUrl, storagePath: null };
    }

    const bytes = new Uint8Array(await response.arrayBuffer());

    if (bytes.byteLength > MAX_ASSET_BYTES) {
      return { persisted: false, url: sourceUrl, storagePath: null };
    }

    const safeAssetId = sanitizeAssetId(input.providerAssetId);
    const storagePath =
      organizationId +
      '/generated/' +
      input.kind +
      '/' +
      input.provider +
      '-' +
      safeAssetId +
      '.' +
      extension;

    const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(
      storagePath,
      bytes,
      {
        contentType,
        cacheControl: '31536000',
        upsert: true,
      },
    );

    if (uploadError) {
      return { persisted: false, url: sourceUrl, storagePath: null };
    }

    await supabase.from('media_assets').upsert(
      {
        organization_id: organizationId,
        created_by: user.id,
        kind: input.kind,
        provider: input.provider,
        provider_asset_id: input.providerAssetId,
        storage_bucket: MEDIA_BUCKET,
        storage_path: storagePath,
        content_type: contentType,
        byte_size: bytes.byteLength,
        duration_seconds: input.durationSeconds ?? null,
        metadata: input.metadata ?? {},
      },
      { onConflict: 'organization_id,provider,provider_asset_id' },
    );

    const { data: signed, error: signedError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    if (signedError || !signed?.signedUrl) {
      return { persisted: true, url: sourceUrl, storagePath };
    }

    return {
      persisted: true,
      url: signed.signedUrl,
      storagePath,
    };
  } catch {
    return { persisted: false, url: sourceUrl, storagePath: null };
  }
}

export async function refreshPersistedMediaUrl(
  storagePath: string,
): Promise<string | null> {
  const normalized = storagePath.trim();

  if (!normalized) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(normalized, SIGNED_URL_TTL_SECONDS);

    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
