-- Knowledge entities (GraphRAG)

CREATE TABLE public.knowledge_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.knowledge_sources (id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.knowledge_items (id) ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5, 4),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX knowledge_entities_organization_id_idx ON public.knowledge_entities (organization_id);
CREATE INDEX knowledge_entities_organization_id_type_idx ON public.knowledge_entities (organization_id, type);
CREATE INDEX knowledge_entities_source_id_idx ON public.knowledge_entities (source_id);
CREATE INDEX knowledge_entities_item_id_idx ON public.knowledge_entities (item_id);

CREATE TRIGGER knowledge_entities_validate_source_org
BEFORE INSERT OR UPDATE ON public.knowledge_entities
FOR EACH ROW
EXECUTE FUNCTION public.validate_knowledge_source_org_match();

CREATE TRIGGER knowledge_entities_validate_item_org
BEFORE INSERT OR UPDATE ON public.knowledge_entities
FOR EACH ROW
EXECUTE FUNCTION public.validate_knowledge_item_org_match();
