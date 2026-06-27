-- Knowledge chunks (RAG)

CREATE TABLE public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.knowledge_sources (id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.knowledge_items (id) ON DELETE CASCADE,
  content text NOT NULL,
  token_count integer,
  position integer NOT NULL,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX knowledge_chunks_item_id_idx ON public.knowledge_chunks (item_id);
CREATE INDEX knowledge_chunks_source_id_idx ON public.knowledge_chunks (source_id);
CREATE INDEX knowledge_chunks_embedding_idx
  ON public.knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);

CREATE TRIGGER knowledge_chunks_validate_source_org
BEFORE INSERT OR UPDATE ON public.knowledge_chunks
FOR EACH ROW
EXECUTE FUNCTION public.validate_knowledge_source_org_match();

CREATE TRIGGER knowledge_chunks_validate_item_org
BEFORE INSERT OR UPDATE ON public.knowledge_chunks
FOR EACH ROW
EXECUTE FUNCTION public.validate_knowledge_item_org_match();
