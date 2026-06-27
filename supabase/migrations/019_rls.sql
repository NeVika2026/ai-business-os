-- Row Level Security

CREATE OR REPLACE FUNCTION public.get_user_role(org_id uuid)
RETURNS public.organization_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.organization_members
  WHERE organization_id = org_id
    AND user_id = auth.uid()
  LIMIT 1;
$$;

-- profiles

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY profiles_insert ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- organizations

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_select ON public.organizations
FOR SELECT
USING (public.get_user_role(id) IS NOT NULL);

CREATE POLICY organizations_insert ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY organizations_update ON public.organizations
FOR UPDATE
USING (public.get_user_role(id) IN ('owner', 'admin'))
WITH CHECK (public.get_user_role(id) IN ('owner', 'admin'));

CREATE POLICY organizations_delete ON public.organizations
FOR DELETE
USING (public.get_user_role(id) = 'owner');

-- organization_members

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_members_select ON public.organization_members
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY organization_members_insert ON public.organization_members
FOR INSERT
WITH CHECK (public.get_user_role(organization_id) IN ('owner', 'admin'));

CREATE POLICY organization_members_update ON public.organization_members
FOR UPDATE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'))
WITH CHECK (public.get_user_role(organization_id) IN ('owner', 'admin'));

CREATE POLICY organization_members_delete ON public.organization_members
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

-- ai_providers

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_providers_select ON public.ai_providers
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ai_models

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_models_select ON public.ai_models
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- projects

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_select ON public.projects
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY projects_insert ON public.projects
FOR INSERT
WITH CHECK (
  public.get_user_role(organization_id) IS NOT NULL
  AND created_by = auth.uid()
);

CREATE POLICY projects_update ON public.projects
FOR UPDATE
USING (public.get_user_role(organization_id) IS NOT NULL)
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY projects_delete ON public.projects
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

-- ai_employees

ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_employees_select ON public.ai_employees
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY ai_employees_insert ON public.ai_employees
FOR INSERT
WITH CHECK (
  public.get_user_role(organization_id) IS NOT NULL
  AND created_by = auth.uid()
);

CREATE POLICY ai_employees_update ON public.ai_employees
FOR UPDATE
USING (public.get_user_role(organization_id) IS NOT NULL)
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY ai_employees_delete ON public.ai_employees
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

-- tasks

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select ON public.tasks
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY tasks_insert ON public.tasks
FOR INSERT
WITH CHECK (
  public.get_user_role(organization_id) IS NOT NULL
  AND created_by = auth.uid()
);

CREATE POLICY tasks_update ON public.tasks
FOR UPDATE
USING (public.get_user_role(organization_id) IS NOT NULL)
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY tasks_delete ON public.tasks
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

-- crm_leads

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_leads_select ON public.crm_leads
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY crm_leads_insert ON public.crm_leads
FOR INSERT
WITH CHECK (
  public.get_user_role(organization_id) IS NOT NULL
  AND created_by = auth.uid()
);

CREATE POLICY crm_leads_update ON public.crm_leads
FOR UPDATE
USING (public.get_user_role(organization_id) IS NOT NULL)
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY crm_leads_delete ON public.crm_leads
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

-- knowledge_sources

ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_sources_select ON public.knowledge_sources
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_sources_insert ON public.knowledge_sources
FOR INSERT
WITH CHECK (
  public.get_user_role(organization_id) IS NOT NULL
  AND created_by = auth.uid()
);

CREATE POLICY knowledge_sources_update ON public.knowledge_sources
FOR UPDATE
USING (public.get_user_role(organization_id) IS NOT NULL)
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_sources_delete ON public.knowledge_sources
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

-- knowledge_items

ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_items_select ON public.knowledge_items
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_items_insert ON public.knowledge_items
FOR INSERT
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_items_update ON public.knowledge_items
FOR UPDATE
USING (public.get_user_role(organization_id) IS NOT NULL)
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_items_delete ON public.knowledge_items
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

-- knowledge_chunks

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_chunks_select ON public.knowledge_chunks
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_chunks_insert ON public.knowledge_chunks
FOR INSERT
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_chunks_update ON public.knowledge_chunks
FOR UPDATE
USING (public.get_user_role(organization_id) IS NOT NULL)
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_chunks_delete ON public.knowledge_chunks
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

-- knowledge_entities

ALTER TABLE public.knowledge_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_entities_select ON public.knowledge_entities
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_entities_insert ON public.knowledge_entities
FOR INSERT
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_entities_update ON public.knowledge_entities
FOR UPDATE
USING (public.get_user_role(organization_id) IS NOT NULL)
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY knowledge_entities_delete ON public.knowledge_entities
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

-- prompts

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY prompts_select ON public.prompts
FOR SELECT
USING (
  (scope = 'global' AND auth.uid() IS NOT NULL)
  OR (organization_id IS NOT NULL AND public.get_user_role(organization_id) IS NOT NULL)
);

CREATE POLICY prompts_insert ON public.prompts
FOR INSERT
WITH CHECK (
  scope <> 'global'
  AND organization_id IS NOT NULL
  AND public.get_user_role(organization_id) IS NOT NULL
  AND created_by = auth.uid()
);

CREATE POLICY prompts_update ON public.prompts
FOR UPDATE
USING (
  organization_id IS NOT NULL
  AND public.get_user_role(organization_id) IN ('owner', 'admin')
)
WITH CHECK (
  organization_id IS NOT NULL
  AND public.get_user_role(organization_id) IN ('owner', 'admin')
);

CREATE POLICY prompts_delete ON public.prompts
FOR DELETE
USING (
  organization_id IS NOT NULL
  AND public.get_user_role(organization_id) IN ('owner', 'admin')
);

-- events

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_select ON public.events
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY events_insert ON public.events
FOR INSERT
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY events_delete ON public.events
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));

-- agent_runs

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_runs_select ON public.agent_runs
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY agent_runs_insert ON public.agent_runs
FOR INSERT
WITH CHECK (
  public.get_user_role(organization_id) IS NOT NULL
  AND created_by = auth.uid()
);

CREATE POLICY agent_runs_update ON public.agent_runs
FOR UPDATE
USING (public.get_user_role(organization_id) IS NOT NULL)
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

-- agent_memories

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_memories_select ON public.agent_memories
FOR SELECT
USING (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY agent_memories_insert ON public.agent_memories
FOR INSERT
WITH CHECK (public.get_user_role(organization_id) IS NOT NULL);

CREATE POLICY agent_memories_delete ON public.agent_memories
FOR DELETE
USING (public.get_user_role(organization_id) IN ('owner', 'admin'));
