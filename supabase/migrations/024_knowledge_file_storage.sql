-- Private uploads for Knowledge Hub auto-import.

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'knowledge-files',
  'knowledge-files',
  false,
  104857600,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'text/markdown',
    'text/html',
    'application/json',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY knowledge_files_select ON storage.objects
FOR SELECT
USING (
  bucket_id = 'knowledge-files'
  AND CASE
    WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.get_user_role(split_part(name, '/', 1)::uuid) IS NOT NULL
    ELSE false
  END
);

CREATE POLICY knowledge_files_insert ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-files'
  AND CASE
    WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.get_user_role(split_part(name, '/', 1)::uuid) IS NOT NULL
    ELSE false
  END
);

CREATE POLICY knowledge_files_update ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'knowledge-files'
  AND CASE
    WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.get_user_role(split_part(name, '/', 1)::uuid) IS NOT NULL
    ELSE false
  END
)
WITH CHECK (
  bucket_id = 'knowledge-files'
  AND CASE
    WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.get_user_role(split_part(name, '/', 1)::uuid) IS NOT NULL
    ELSE false
  END
);

CREATE POLICY knowledge_files_delete ON storage.objects
FOR DELETE
USING (
  bucket_id = 'knowledge-files'
  AND CASE
    WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.get_user_role(split_part(name, '/', 1)::uuid) IN ('owner', 'admin')
    ELSE false
  END
);
