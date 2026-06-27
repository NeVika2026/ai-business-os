-- Prompt library

CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE CASCADE,
  ai_employee_id uuid REFERENCES public.ai_employees (id) ON DELETE CASCADE,
  scope public.prompt_scope NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  content text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1,
  rating numeric(3, 2),
  usage_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  updated_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX prompts_organization_id_idx ON public.prompts (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX prompts_scope_is_active_idx ON public.prompts (scope, is_active);
CREATE INDEX prompts_organization_id_category_idx
  ON public.prompts (organization_id, category)
  WHERE organization_id IS NOT NULL;
CREATE INDEX prompts_tags_idx ON public.prompts USING gin (tags);

CREATE TRIGGER prompts_set_updated_at
BEFORE UPDATE ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER prompts_validate_project_org
BEFORE INSERT OR UPDATE ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION public.validate_project_org_match();

CREATE TRIGGER prompts_validate_ai_employee_org
BEFORE INSERT OR UPDATE ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION public.validate_ai_employee_org_match();
