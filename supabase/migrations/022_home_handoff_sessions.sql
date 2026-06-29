-- Home handoff sessions (server-side Home → OSA bridge)

CREATE TYPE public.home_handoff_session_status AS ENUM (
  'created',
  'opened',
  'consumed',
  'expired',
  'cancelled'
);

CREATE TABLE public.home_handoff_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  goal_id text NOT NULL,
  goal_title text NOT NULL,
  starter_prompt text NOT NULL,
  recommended_team jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_project_type text NOT NULL DEFAULT 'general',
  created_project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  status public.home_handoff_session_status NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX home_handoff_sessions_organization_user_created_idx
ON public.home_handoff_sessions (organization_id, user_id, created_at DESC);

CREATE INDEX home_handoff_sessions_expires_at_idx
ON public.home_handoff_sessions (expires_at)
WHERE status IN ('created', 'opened');

ALTER TABLE public.home_handoff_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY home_handoff_sessions_select ON public.home_handoff_sessions
FOR SELECT
USING (
  user_id = auth.uid()
  AND public.get_user_role(organization_id) IS NOT NULL
);

CREATE POLICY home_handoff_sessions_insert ON public.home_handoff_sessions
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND public.get_user_role(organization_id) IS NOT NULL
);

CREATE POLICY home_handoff_sessions_update ON public.home_handoff_sessions
FOR UPDATE
USING (
  user_id = auth.uid()
  AND public.get_user_role(organization_id) IS NOT NULL
)
WITH CHECK (
  user_id = auth.uid()
  AND public.get_user_role(organization_id) IS NOT NULL
);
