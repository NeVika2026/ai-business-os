-- Agent memories

CREATE TABLE public.agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  ai_employee_id uuid REFERENCES public.ai_employees (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  scope text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  importance numeric(5, 4) NOT NULL DEFAULT 0.5,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX agent_memories_organization_id_idx ON public.agent_memories (organization_id);
CREATE INDEX agent_memories_ai_employee_id_idx ON public.agent_memories (ai_employee_id);
CREATE INDEX agent_memories_project_id_idx ON public.agent_memories (project_id);
CREATE INDEX agent_memories_importance_idx ON public.agent_memories (importance);
CREATE INDEX agent_memories_embedding_idx
  ON public.agent_memories
  USING hnsw (embedding vector_cosine_ops);

CREATE TRIGGER agent_memories_validate_project_org
BEFORE INSERT OR UPDATE ON public.agent_memories
FOR EACH ROW
EXECUTE FUNCTION public.validate_project_org_match();

CREATE TRIGGER agent_memories_validate_ai_employee_org
BEFORE INSERT OR UPDATE ON public.agent_memories
FOR EACH ROW
EXECUTE FUNCTION public.validate_ai_employee_org_match();
