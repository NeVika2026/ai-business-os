-- Projects

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  project_type text NOT NULL DEFAULT 'general',
  icon text,
  color text,
  status public.project_status NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  updated_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX projects_organization_id_idx ON public.projects (organization_id);
CREATE INDEX projects_organization_id_status_idx ON public.projects (organization_id, status);
CREATE INDEX projects_organization_id_project_type_idx ON public.projects (organization_id, project_type);

CREATE TRIGGER projects_set_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
