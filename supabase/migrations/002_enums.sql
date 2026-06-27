-- Enum types

CREATE TYPE public.organization_role AS ENUM ('owner', 'admin', 'member');

CREATE TYPE public.project_status AS ENUM ('active', 'archived');

CREATE TYPE public.ai_employee_status AS ENUM ('active', 'inactive');

CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled');

CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'lost', 'won');

CREATE TYPE public.knowledge_source_type AS ENUM (
  'telegram',
  'vk',
  'youtube',
  'pdf',
  'docx',
  'html',
  'website',
  'book',
  'zip',
  'audio',
  'video',
  'manual'
);

CREATE TYPE public.knowledge_import_status AS ENUM (
  'pending',
  'parsing',
  'chunking',
  'embedding',
  'extracting',
  'completed',
  'failed'
);

CREATE TYPE public.knowledge_item_type AS ENUM ('document', 'section', 'entity', 'insight');

CREATE TYPE public.prompt_scope AS ENUM ('global', 'organization', 'project', 'ai_employee');

CREATE TYPE public.agent_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
