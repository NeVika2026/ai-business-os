-- Restrict Business Factory RLS policies to authenticated users explicitly.
-- Existing USING/WITH CHECK expressions are preserved.

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND roles = ARRAY['public']::name[]
      AND tablename IN (
        'profiles','organizations','organization_members','ai_providers','ai_models',
        'projects','ai_employees','tasks','crm_leads','knowledge_sources',
        'knowledge_items','knowledge_chunks','knowledge_entities','prompts','events',
        'agent_runs','agent_memories','home_handoff_sessions','media_assets'
      )
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON public.%I TO authenticated',
      p.policyname,
      p.tablename
    );
  END LOOP;
END;
$$;
