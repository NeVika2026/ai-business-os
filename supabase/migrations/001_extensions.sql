-- Extensions and shared trigger functions

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_project_org_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = NEW.project_id
        AND p.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'project_id must belong to the same organization';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_ai_employee_org_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ai_employee_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.ai_employees ae
      WHERE ae.id = NEW.ai_employee_id
        AND ae.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'ai_employee_id must belong to the same organization';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_knowledge_source_org_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.source_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.knowledge_sources ks
      WHERE ks.id = NEW.source_id
        AND ks.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'source_id must belong to the same organization';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_knowledge_item_org_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.item_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.knowledge_items ki
      WHERE ki.id = NEW.item_id
        AND ki.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'item_id must belong to the same organization';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_parent_run_org_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.parent_run_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.agent_runs ar
      WHERE ar.id = NEW.parent_run_id
        AND ar.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'parent_run_id must belong to the same organization';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_ai_model_provider_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.ai_models m
    WHERE m.id = NEW.model_id
      AND m.provider_id = NEW.provider_id
  ) THEN
    RAISE EXCEPTION 'model_id must belong to provider_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_task_org_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.task_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = NEW.task_id
        AND t.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'task_id must belong to the same organization';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
