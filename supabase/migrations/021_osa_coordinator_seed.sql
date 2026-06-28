-- OSA Navigator coordinator employees for demo organizations

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
    'osa000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'b1000001-0000-4000-8000-000000000001',
    'a1000001-0000-4000-8000-000000000001',
    'a2000001-0000-4000-8000-000000000001',
    'OSA Navigator',
    'OSA Navigator',
    'You coordinate the OSA agent team and turn business requests into actionable plans.',
    '{"temperature":0.6,"top_p":1.0,"max_tokens":4096}'::jsonb,
    '{"enabled":true,"scope":"organization","retention_days":90}'::jsonb,
    '[{"id":"knowledge_search","enabled":true},{"id":"crm_read","enabled":true}]'::jsonb,
    '{"can_create_tasks":true,"can_update_leads":false,"can_publish_content":false}'::jsonb,
    'active',
    true,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'osa000002-0000-4000-8000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'b1000002-0000-4000-8000-000000000002',
    'a1000002-0000-4000-8000-000000000002',
    'a2000003-0000-4000-8000-000000000003',
    'OSA Navigator',
    'OSA Navigator',
    'You coordinate the OSA agent team and turn business requests into actionable plans.',
    '{"temperature":0.6,"top_p":1.0,"max_tokens":4096}'::jsonb,
    '{"enabled":true,"scope":"organization","retention_days":90}'::jsonb,
    '[{"id":"knowledge_search","enabled":true},{"id":"crm_read","enabled":true}]'::jsonb,
    '{"can_create_tasks":true,"can_update_leads":false,"can_publish_content":false}'::jsonb,
    'active',
    true,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  )
ON CONFLICT (id) DO NOTHING;
