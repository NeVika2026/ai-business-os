-- Business Factory security hardening.
-- Applied to production Supabase before this migration was committed.

ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.validate_project_org_match() SET search_path = public;
ALTER FUNCTION public.validate_ai_employee_org_match() SET search_path = public;
ALTER FUNCTION public.validate_knowledge_source_org_match() SET search_path = public;
ALTER FUNCTION public.validate_knowledge_item_org_match() SET search_path = public;
ALTER FUNCTION public.validate_parent_run_org_match() SET search_path = public;
ALTER FUNCTION public.validate_ai_model_provider_match() SET search_path = public;
ALTER FUNCTION public.validate_task_org_match() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_organization() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
