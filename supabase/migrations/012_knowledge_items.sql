-- Knowledge items

CREATE TABLE public.knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.knowledge_sources (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  type public.knowledge_item_type NOT NULL,
  title text NOT NULL,
  content text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer,
  created_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX knowledge_items_source_id_idx ON public.knowledge_items (source_id);
CREATE INDEX knowledge_items_organization_id_idx ON public.knowledge_items (organization_id);

CREATE TRIGGER knowledge_items_set_updated_at
BEFORE UPDATE ON public.knowledge_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER knowledge_items_validate_project_org
BEFORE INSERT OR UPDATE ON public.knowledge_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_project_org_match();

CREATE TRIGGER knowledge_items_validate_source_org
BEFORE INSERT OR UPDATE ON public.knowledge_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_knowledge_source_org_match();
