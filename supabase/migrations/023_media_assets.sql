
-- Persistent generated media assets and private storage bucket.

CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('video', 'image', 'audio')),
  provider text NOT NULL,
  provider_asset_id text,
  storage_bucket text NOT NULL DEFAULT 'media-assets',
  storage_path text NOT NULL,
  content_type text,
  byte_size bigint,
  duration_seconds numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, provider_asset_id)
);

CREATE INDEX media_assets_organization_id_created_at_idx
ON public.media_assets (organization_id, created_at DESC);

CREATE INDEX media_assets_project_id_idx
ON public.media_assets (project_id)
WHERE project_id IS NOT NULL;

CREATE TRIGGER media_assets_set_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_assets_select ON public.media_assets
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY media_assets_insert ON public.media_assets
FOR INSERT
WITH CHECK (
  public.get_user_role(organization_id) IS NOT NULL
  AND created_by = auth.uid()
);

CREATE POLICY media_assets_update ON public.media_assets
FOR UPDATE
USING (public.get_user_role(organization_id) IS NOT NULL)
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY media_assets_delete ON public.media_assets
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'media-assets',
  'media-assets',
  false,
  262144000,
  ARRAY[
    'video/mp4',
    'video/webm',
    'image/png',
    'image/jpeg',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/webm'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY media_storage_select ON storage.objects
FOR SELECT
USING (
  bucket_id = 'media-assets'
  AND CASE
    WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.get_user_role(split_part(name, '/', 1)::uuid) IS NOT NULL
    ELSE false
  END
);

CREATE POLICY media_storage_insert ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'media-assets'
  AND CASE
    WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.get_user_role(split_part(name, '/', 1)::uuid) IS NOT NULL
    ELSE false
  END
);

CREATE POLICY media_storage_update ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'media-assets'
  AND CASE
    WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.get_user_role(split_part(name, '/', 1)::uuid) IS NOT NULL
    ELSE false
  END
)
WITH CHECK (
  bucket_id = 'media-assets'
  AND CASE
    WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.get_user_role(split_part(name, '/', 1)::uuid) IS NOT NULL
    ELSE false
  END
);

CREATE POLICY media_storage_delete ON storage.objects
FOR DELETE
USING (
  bucket_id = 'media-assets'
  AND CASE
    WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.get_user_role(split_part(name, '/', 1)::uuid) IN ('owner', 'admin')
    ELSE false
  END
);
