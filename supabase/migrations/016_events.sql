-- Event bus

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  type text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  source text NOT NULL,
  actor_type text NOT NULL DEFAULT 'user',
  actor_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_organization_id_created_at_idx ON public.events (organization_id, created_at DESC);
CREATE INDEX events_organization_id_type_idx ON public.events (organization_id, type);
CREATE INDEX events_organization_id_actor_type_idx ON public.events (organization_id, actor_type);
CREATE INDEX events_actor_id_idx ON public.events (actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX events_correlation_id_idx ON public.events (correlation_id) WHERE correlation_id IS NOT NULL;
