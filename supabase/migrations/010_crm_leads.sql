-- CRM leads

CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  status public.lead_status NOT NULL DEFAULT 'new',
  source text,
  notes text,
  last_contact_at timestamptz,
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  updated_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX crm_leads_organization_id_idx ON public.crm_leads (organization_id);
CREATE INDEX crm_leads_organization_id_status_idx ON public.crm_leads (organization_id, status);
CREATE INDEX crm_leads_assigned_to_idx ON public.crm_leads (assigned_to) WHERE assigned_to IS NOT NULL;

CREATE TRIGGER crm_leads_set_updated_at
BEFORE UPDATE ON public.crm_leads
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER crm_leads_validate_project_org
BEFORE INSERT OR UPDATE ON public.crm_leads
FOR EACH ROW
EXECUTE FUNCTION public.validate_project_org_match();
