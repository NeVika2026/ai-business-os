-- Seed data for local development and RLS verification

-- Users (profiles created via auth.users trigger)

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'user_a@demo.local',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"User A"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'user_b@demo.local',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"User B"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"user_a@demo.local"}'::jsonb,
    'email',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    now(),
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","email":"user_b@demo.local"}'::jsonb,
    'email',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    now(),
    now(),
    now()
  );

-- Global AI catalog

INSERT INTO public.ai_providers (id, code, name, website, is_active)
VALUES
  ('a1000001-0000-4000-8000-000000000001', 'openai', 'OpenAI', 'https://openai.com', true),
  ('a1000002-0000-4000-8000-000000000002', 'anthropic', 'Anthropic', 'https://anthropic.com', true),
  ('a1000003-0000-4000-8000-000000000003', 'google', 'Google', 'https://ai.google.dev', true);

INSERT INTO public.ai_models (
  id,
  provider_id,
  code,
  name,
  context_window,
  supports_tools,
  supports_vision,
  supports_image,
  supports_audio,
  is_active
)
VALUES
  (
    'a2000001-0000-4000-8000-000000000001',
    'a1000001-0000-4000-8000-000000000001',
    'gpt-4o',
    'GPT-4o',
    128000,
    true,
    true,
    true,
    true,
    true
  ),
  (
    'a2000002-0000-4000-8000-000000000002',
    'a1000001-0000-4000-8000-000000000001',
    'gpt-4o-mini',
    'GPT-4o Mini',
    128000,
    true,
    true,
    false,
    false,
    true
  ),
  (
    'a2000003-0000-4000-8000-000000000003',
    'a1000002-0000-4000-8000-000000000002',
    'claude-sonnet-4',
    'Claude Sonnet 4',
    200000,
    true,
    true,
    false,
    false,
    true
  ),
  (
    'a2000004-0000-4000-8000-000000000004',
    'a1000002-0000-4000-8000-000000000002',
    'claude-haiku-4',
    'Claude Haiku 4',
    200000,
    true,
    false,
    false,
    false,
    true
  ),
  (
    'a2000005-0000-4000-8000-000000000005',
    'a1000003-0000-4000-8000-000000000003',
    'gemini-2.0-pro',
    'Gemini 2.0 Pro',
    1000000,
    true,
    true,
    true,
    true,
    true
  ),
  (
    'a2000006-0000-4000-8000-000000000006',
    'a1000003-0000-4000-8000-000000000003',
    'gemini-2.0-flash',
    'Gemini 2.0 Flash',
    1000000,
    true,
    true,
    false,
    false,
    true
  );

-- Global prompts

INSERT INTO public.prompts (
  id,
  organization_id,
  project_id,
  ai_employee_id,
  scope,
  name,
  description,
  category,
  tags,
  content,
  variables,
  version,
  rating,
  usage_count,
  is_active,
  created_by
)
VALUES
  (
    'd1000001-0000-4000-8000-000000000001',
    NULL,
    NULL,
    NULL,
    'global',
    'Default Sales System',
    'Base system prompt for sales AI employees',
    'sales',
    ARRAY['sales', 'system'],
    'You are a professional sales assistant. Help qualify leads and move them through the pipeline.',
    '[]'::jsonb,
    1,
    4.50,
    120,
    true,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'd1000002-0000-4000-8000-000000000002',
    NULL,
    NULL,
    NULL,
    'global',
    'Default Copywriter',
    'Base prompt for marketing copy',
    'marketing',
    ARRAY['marketing', 'copy'],
    'You are an expert copywriter. Write clear, persuasive content aligned with brand voice.',
    '[]'::jsonb,
    1,
    4.20,
    85,
    true,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  );

-- Organizations (owner membership created by bootstrap trigger)

INSERT INTO public.organizations (id, name, settings, created_by)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Demo Org A',
    '{"theme":"dark","language":"ru","timezone":"Europe/Moscow","branding":{},"features":{},"limits":{},"billing":{}}'::jsonb,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Demo Org B',
    '{"theme":"dark","language":"en","timezone":"UTC","branding":{},"features":{},"limits":{},"billing":{}}'::jsonb,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  );

INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'member');

-- Projects

INSERT INTO public.projects (
  id,
  organization_id,
  name,
  description,
  project_type,
  status,
  created_by
)
VALUES
  (
    'b1000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Marketing Launch',
    'Q2 marketing campaign',
    'marketing',
    'active',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'b1000002-0000-4000-8000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'General Workspace',
    'Default project',
    'general',
    'active',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  );

-- AI employees

INSERT INTO public.ai_employees (
  id,
  organization_id,
  project_id,
  provider_id,
  model_id,
  name,
  role_title,
  system_prompt,
  configuration,
  memory,
  tools,
  permissions,
  status,
  is_active,
  created_by
)
VALUES
  (
    'c1000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'b1000001-0000-4000-8000-000000000001',
    'a1000001-0000-4000-8000-000000000001',
    'a2000001-0000-4000-8000-000000000001',
    'Alex CEO',
    'Chief Executive Officer',
    'You orchestrate marketing and sales workflows.',
    '{"temperature":0.7,"top_p":1.0,"max_tokens":4096}'::jsonb,
    '{"enabled":true,"scope":"organization","retention_days":90}'::jsonb,
    '[{"id":"web_search","enabled":true},{"id":"crm_read","enabled":true}]'::jsonb,
    '{"can_create_tasks":true,"can_update_leads":true,"can_publish_content":false}'::jsonb,
    'active',
    true,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'c1000002-0000-4000-8000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'b1000002-0000-4000-8000-000000000002',
    'a1000002-0000-4000-8000-000000000002',
    'a2000003-0000-4000-8000-000000000003',
    'Maya Support',
    'Customer Support Agent',
    'You help customers with product questions.',
    '{"temperature":0.5,"top_p":1.0,"max_tokens":2048}'::jsonb,
    '{"enabled":true,"scope":"ai_employee","retention_days":30}'::jsonb,
    '[{"id":"knowledge_search","enabled":true}]'::jsonb,
    '{"can_create_tasks":false,"can_update_leads":false}'::jsonb,
    'active',
    true,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  );

-- Org-scoped prompts

INSERT INTO public.prompts (
  id,
  organization_id,
  scope,
  name,
  category,
  tags,
  content,
  created_by
)
VALUES
  (
    'd2000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'organization',
    'Org A Lead Qualifier',
    'sales',
    ARRAY['sales', 'qualification'],
    'Qualify the lead using BANT criteria.',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'd2000002-0000-4000-8000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'organization',
    'Org B Support Reply',
    'support',
    ARRAY['support', 'reply'],
    'Draft a helpful support response.',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  );

-- Tasks

INSERT INTO public.tasks (
  id,
  organization_id,
  project_id,
  ai_employee_id,
  title,
  status,
  priority,
  estimated_minutes,
  created_by
)
VALUES
  (
    'e1000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'b1000001-0000-4000-8000-000000000001',
    'c1000001-0000-4000-8000-000000000001',
    'Draft campaign brief',
    'in_progress',
    2,
    60,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'e1000002-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'b1000001-0000-4000-8000-000000000001',
    NULL,
    'Review ad copy',
    'todo',
    3,
    30,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'e1000003-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    NULL,
    'Schedule social posts',
    'todo',
    4,
    45,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'e2000001-0000-4000-8000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'b1000002-0000-4000-8000-000000000002',
    'c1000002-0000-4000-8000-000000000002',
    'Answer ticket #42',
    'in_progress',
    1,
    15,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ),
  (
    'e2000002-0000-4000-8000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    NULL,
    NULL,
    'Update FAQ',
    'todo',
    3,
    90,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  );

-- CRM leads

INSERT INTO public.crm_leads (
  id,
  organization_id,
  project_id,
  name,
  email,
  status,
  source,
  created_by
)
VALUES
  (
    'f1000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'b1000001-0000-4000-8000-000000000001',
    'Ivan Petrov',
    'ivan@example.com',
    'new',
    'website',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'f1000002-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'b1000001-0000-4000-8000-000000000001',
    'Maria Sokolova',
    'maria@example.com',
    'contacted',
    'referral',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'f1000003-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'Alexey Kim',
    'alexey@example.com',
    'qualified',
    'telegram',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'f2000001-0000-4000-8000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'b1000002-0000-4000-8000-000000000002',
    'Jane Doe',
    'jane@example.com',
    'new',
    'email',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ),
  (
    'f2000002-0000-4000-8000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    NULL,
    'John Smith',
    'john@example.com',
    'contacted',
    'chat',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  );

-- Knowledge pipeline

INSERT INTO public.knowledge_sources (
  id,
  organization_id,
  project_id,
  type,
  title,
  source_uri,
  content_hash,
  status,
  items_count,
  chunks_count,
  created_by,
  completed_at
)
VALUES
  (
    '01000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'b1000001-0000-4000-8000-000000000001',
    'pdf',
    'Product Guide',
    'storage://org-a/product-guide.pdf',
    'sha256:abc123orga',
    'completed',
    2,
    4,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    now()
  ),
  (
    '01200001-0000-4000-8000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'b1000002-0000-4000-8000-000000000002',
    'manual',
    'Support Playbook',
    NULL,
    'sha256:def456orgb',
    'completed',
    2,
    4,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    now()
  );

INSERT INTO public.knowledge_items (
  id,
  organization_id,
  source_id,
  project_id,
  type,
  title,
  content,
  position,
  created_by
)
VALUES
  (
    '02000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '01000001-0000-4000-8000-000000000001',
    'b1000001-0000-4000-8000-000000000001',
    'document',
    'Introduction',
    'Welcome to our product platform.',
    1,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    '02000002-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '01000001-0000-4000-8000-000000000001',
    'b1000001-0000-4000-8000-000000000001',
    'section',
    'Pricing',
    'Our pricing tiers include Starter, Pro, and Enterprise.',
    2,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    '02200001-0000-4000-8000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    '01200001-0000-4000-8000-000000000001',
    'b1000002-0000-4000-8000-000000000002',
    'document',
    'Ticket Triage',
    'Classify tickets by severity and route to the right team.',
    1,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ),
  (
    '02200002-0000-4000-8000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    '01200001-0000-4000-8000-000000000001',
    'b1000002-0000-4000-8000-000000000002',
    'section',
    'Escalation',
    'Escalate to human agent when confidence is below 0.7.',
    2,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  );

INSERT INTO public.knowledge_chunks (
  id,
  organization_id,
  source_id,
  item_id,
  content,
  token_count,
  position
)
VALUES
  ('03000001-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', '01000001-0000-4000-8000-000000000001', '02000001-0000-4000-8000-000000000001', 'Welcome to our product platform.', 8, 1),
  ('03000002-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', '01000001-0000-4000-8000-000000000001', '02000001-0000-4000-8000-000000000001', 'Built for AI-native business operations.', 7, 2),
  ('03000003-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', '01000001-0000-4000-8000-000000000001', '02000002-0000-4000-8000-000000000002', 'Starter plan begins at $29/month.', 7, 1),
  ('03000004-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', '01000001-0000-4000-8000-000000000001', '02000002-0000-4000-8000-000000000002', 'Enterprise includes custom SLAs.', 5, 2),
  ('03200001-0000-4000-8000-000000000001', '22222222-2222-2222-2222-222222222222', '01200001-0000-4000-8000-000000000001', '02200001-0000-4000-8000-000000000001', 'Classify tickets by severity.', 5, 1),
  ('03200002-0000-4000-8000-000000000002', '22222222-2222-2222-2222-222222222222', '01200001-0000-4000-8000-000000000001', '02200001-0000-4000-8000-000000000001', 'Route to the right team.', 5, 2),
  ('03200003-0000-4000-8000-000000000003', '22222222-2222-2222-2222-222222222222', '01200001-0000-4000-8000-000000000001', '02200002-0000-4000-8000-000000000002', 'Escalate when confidence is below 0.7.', 8, 1),
  ('03200004-0000-4000-8000-000000000004', '22222222-2222-2222-2222-222222222222', '01200001-0000-4000-8000-000000000001', '02200002-0000-4000-8000-000000000002', 'Human agents handle complex cases.', 6, 2);

INSERT INTO public.knowledge_entities (
  id,
  organization_id,
  source_id,
  item_id,
  type,
  name,
  description,
  confidence
)
VALUES
  ('04000001-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', '01000001-0000-4000-8000-000000000001', '02000002-0000-4000-8000-000000000002', 'product', 'Starter Plan', 'Entry tier pricing', 0.9200),
  ('04000002-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', '01000001-0000-4000-8000-000000000001', '02000002-0000-4000-8000-000000000002', 'company', 'Enterprise', 'Enterprise offering', 0.8800),
  ('04000003-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', '01000001-0000-4000-8000-000000000001', '02000001-0000-4000-8000-000000000001', 'concept', 'AI-native operations', 'Core product concept', 0.7500),
  ('04200001-0000-4000-8000-000000000001', '22222222-2222-2222-2222-222222222222', '01200001-0000-4000-8000-000000000001', '02200001-0000-4000-8000-000000000001', 'process', 'Ticket Triage', 'Support triage workflow', 0.9100),
  ('04200002-0000-4000-8000-000000000002', '22222222-2222-2222-2222-222222222222', '01200001-0000-4000-8000-000000000001', '02200002-0000-4000-8000-000000000002', 'concept', 'Escalation threshold', 'Confidence cutoff at 0.7', 0.8600);

-- Events

INSERT INTO public.events (
  id,
  organization_id,
  type,
  source,
  actor_type,
  actor_id,
  payload,
  correlation_id
)
VALUES
  (
    '05000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'lead.created',
    'crm',
    'user',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '{"lead_id":"f1000001-0000-4000-8000-000000000001"}'::jsonb,
    '05000001-0000-4000-8000-000000000001'
  ),
  (
    '05000002-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'task.assigned',
    'tasks',
    'ai_employee',
    'c1000001-0000-4000-8000-000000000001',
    '{"task_id":"e1000001-0000-4000-8000-000000000001"}'::jsonb,
    '05000001-0000-4000-8000-000000000001'
  ),
  (
    '05000003-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'knowledge.import.completed',
    'knowledge',
    'system',
    NULL,
    '{"source_id":"01000001-0000-4000-8000-000000000001"}'::jsonb,
    NULL
  ),
  (
    '05200001-0000-4000-8000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'lead.created',
    'crm',
    'user',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '{"lead_id":"f2000001-0000-4000-8000-000000000001"}'::jsonb,
    NULL
  ),
  (
    '05200002-0000-4000-8000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'agent.run.completed',
    'agents',
    'ai_employee',
    'c1000002-0000-4000-8000-000000000002',
    '{"run_id":"06200001-0000-4000-8000-000000000001"}'::jsonb,
    NULL
  );

-- Agent runs (CEO -> Marketing chain in Org A)

INSERT INTO public.agent_runs (
  id,
  organization_id,
  ai_employee_id,
  parent_run_id,
  event_id,
  task_id,
  prompt_id,
  status,
  input,
  output,
  tokens_input,
  tokens_output,
  started_at,
  completed_at,
  created_by
)
VALUES
  (
    '06000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'c1000001-0000-4000-8000-000000000001',
    NULL,
    '05000002-0000-4000-8000-000000000002',
    'e1000001-0000-4000-8000-000000000001',
    'd2000001-0000-4000-8000-000000000001',
    'completed',
    '{"action":"orchestrate_campaign"}'::jsonb,
    '{"next_agent":"marketing"}'::jsonb,
    450,
    320,
    now() - interval '10 minutes',
    now() - interval '9 minutes',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    '06000002-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'c1000001-0000-4000-8000-000000000001',
    '06000001-0000-4000-8000-000000000001',
    NULL,
    'e1000001-0000-4000-8000-000000000001',
    'd2000001-0000-4000-8000-000000000001',
    'completed',
    '{"action":"draft_campaign_brief"}'::jsonb,
    '{"brief":"Q2 launch campaign brief draft"}'::jsonb,
    800,
    1200,
    now() - interval '8 minutes',
    now() - interval '5 minutes',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    '06200001-0000-4000-8000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'c1000002-0000-4000-8000-000000000002',
    NULL,
    '05200002-0000-4000-8000-000000000002',
    'e2000001-0000-4000-8000-000000000001',
    'd2000002-0000-4000-8000-000000000002',
    'completed',
    '{"ticket_id":42}'::jsonb,
    '{"reply":"Thank you for reaching out..."}'::jsonb,
    200,
    350,
    now() - interval '3 minutes',
    now() - interval '2 minutes',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  );

-- Agent memories

INSERT INTO public.agent_memories (
  id,
  organization_id,
  ai_employee_id,
  project_id,
  scope,
  content,
  importance,
  created_by
)
VALUES
  (
    '07000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'c1000001-0000-4000-8000-000000000001',
    'b1000001-0000-4000-8000-000000000001',
    'ai_employee',
    'Lead Ivan prefers Telegram communication.',
    0.8000,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    '07000002-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'c1000001-0000-4000-8000-000000000001',
    NULL,
    'organization',
    'Q2 campaign target audience: SMB in CIS region.',
    0.6500,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    '07200001-0000-4000-8000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'c1000002-0000-4000-8000-000000000002',
    'b1000002-0000-4000-8000-000000000002',
    'ai_employee',
    'Customer Jane reported billing issue on March 15.',
    0.9000,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ),
  (
    '07200002-0000-4000-8000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    NULL,
    NULL,
    'organization',
    'Support SLA: respond within 4 business hours.',
    0.7000,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  );
