-- Knowledge sources

CREATE TABLE public.knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  type public.knowledge_source_type NOT NULL,
  title text NOT NULL,
  source_uri text,
  content_hash text,
  status public.knowledge_import_status NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  items_count integer NOT NULL DEFAULT 0,
  chunks_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  updated_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX knowledge_sources_organization_id_idx ON public.knowledge_sources (organization_id);
CREATE INDEX knowledge_sources_organization_id_status_idx ON public.knowledge_sources (organization_id, status);
CREATE INDEX knowledge_sources_organization_id_content_hash_idx
  ON public.knowledge_sources (organization_id, content_hash)
  WHERE content_hash IS NOT NULL;

CREATE TRIGGER knowledge_sources_set_updated_at
BEFORE UPDATE ON public.knowledge_sources
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER knowledge_sources_validate_project_org
BEFORE INSERT OR UPDATE ON public.knowledge_sources
FOR EACH ROW
EXECUTE FUNCTION public.validate_project_org_match();
