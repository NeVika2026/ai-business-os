-- AI employees

CREATE TABLE public.ai_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  provider_id uuid NOT NULL REFERENCES public.ai_providers (id) ON DELETE RESTRICT,
  model_id uuid NOT NULL REFERENCES public.ai_models (id) ON DELETE RESTRICT,
  name text NOT NULL,
  role_title text NOT NULL,
  system_prompt text,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  memory jsonb NOT NULL DEFAULT '{}'::jsonb,
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  avatar_url text,
  color text,
  status public.ai_employee_status NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  updated_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_employees_organization_id_idx ON public.ai_employees (organization_id);
CREATE INDEX ai_employees_project_id_idx ON public.ai_employees (project_id) WHERE project_id IS NOT NULL;

CREATE TRIGGER ai_employees_set_updated_at
BEFORE UPDATE ON public.ai_employees
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ai_employees_validate_project_org
BEFORE INSERT OR UPDATE ON public.ai_employees
FOR EACH ROW
EXECUTE FUNCTION public.validate_project_org_match();

CREATE TRIGGER ai_employees_validate_model_provider
BEFORE INSERT OR UPDATE ON public.ai_employees
FOR EACH ROW
EXECUTE FUNCTION public.validate_ai_model_provider_match();
