-- Agent runs

CREATE TABLE public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  ai_employee_id uuid NOT NULL REFERENCES public.ai_employees (id) ON DELETE CASCADE,
  parent_run_id uuid REFERENCES public.agent_runs (id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events (id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.tasks (id) ON DELETE SET NULL,
  prompt_id uuid REFERENCES public.prompts (id) ON DELETE SET NULL,
  status public.agent_run_status NOT NULL DEFAULT 'pending',
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  tokens_input integer,
  tokens_output integer,
  credits_consumed numeric(10, 4),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX agent_runs_organization_id_created_at_idx ON public.agent_runs (organization_id, created_at DESC);
CREATE INDEX agent_runs_ai_employee_id_idx ON public.agent_runs (ai_employee_id);
CREATE INDEX agent_runs_event_id_idx ON public.agent_runs (event_id) WHERE event_id IS NOT NULL;
CREATE INDEX agent_runs_parent_run_id_idx ON public.agent_runs (parent_run_id) WHERE parent_run_id IS NOT NULL;

CREATE TRIGGER agent_runs_validate_ai_employee_org
BEFORE INSERT OR UPDATE ON public.agent_runs
FOR EACH ROW
EXECUTE FUNCTION public.validate_ai_employee_org_match();

CREATE TRIGGER agent_runs_validate_parent_run_org
BEFORE INSERT OR UPDATE ON public.agent_runs
FOR EACH ROW
EXECUTE FUNCTION public.validate_parent_run_org_match();

CREATE TRIGGER agent_runs_validate_task_org
BEFORE INSERT OR UPDATE ON public.agent_runs
FOR EACH ROW
EXECUTE FUNCTION public.validate_task_org_match();
