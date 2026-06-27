-- Global AI model catalog

CREATE TABLE public.ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.ai_providers (id) ON DELETE RESTRICT,
  code text NOT NULL,
  name text NOT NULL,
  context_window integer,
  supports_tools boolean NOT NULL DEFAULT false,
  supports_vision boolean NOT NULL DEFAULT false,
  supports_image boolean NOT NULL DEFAULT false,
  supports_audio boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (provider_id, code)
);

CREATE INDEX ai_models_provider_id_code_idx ON public.ai_models (provider_id, code);
