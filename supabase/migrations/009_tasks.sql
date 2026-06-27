-- Tasks

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  ai_employee_id uuid REFERENCES public.ai_employees (id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority integer NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  estimated_minutes integer,
  actual_minutes integer,
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  due_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  updated_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_organization_id_idx ON public.tasks (organization_id);
CREATE INDEX tasks_organization_id_status_idx ON public.tasks (organization_id, status);
CREATE INDEX tasks_organization_id_priority_idx ON public.tasks (organization_id, priority);
CREATE INDEX tasks_organization_id_status_priority_idx ON public.tasks (organization_id, status, priority);
CREATE INDEX tasks_assigned_to_idx ON public.tasks (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX tasks_due_at_idx ON public.tasks (due_at) WHERE due_at IS NOT NULL;

CREATE TRIGGER tasks_set_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tasks_validate_project_org
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.validate_project_org_match();

CREATE TRIGGER tasks_validate_ai_employee_org
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.validate_ai_employee_org_match();
