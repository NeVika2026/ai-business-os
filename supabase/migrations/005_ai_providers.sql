-- Global AI provider catalog

CREATE TABLE public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  website text,
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX ai_providers_code_idx ON public.ai_providers (code);
