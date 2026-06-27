'use server';

import { revalidatePath } from 'next/cache';

import type { AiEmployeeMemory, AiEmployeeStatus, AiEmployeeTool, MemoryScope } from '@/types/ai';
import { AI_EMPLOYEE_STATUSES, AVAILABLE_TOOLS, MEMORY_SCOPES } from '@/types/ai';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

function getOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseStatus(value: FormDataEntryValue | null): AiEmployeeStatus {
  if (typeof value === 'string' && AI_EMPLOYEE_STATUSES.includes(value as AiEmployeeStatus)) {
    return value as AiEmployeeStatus;
  }

  return 'active';
}

function parseNumber(value: FormDataEntryValue | null, fallback: number) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === 'on' || value === 'true' || value === '1';
}

function parseMemoryScope(value: FormDataEntryValue | null): MemoryScope {
  if (typeof value === 'string' && MEMORY_SCOPES.includes(value as MemoryScope)) {
    return value as MemoryScope;
  }

  return 'ai_employee';
}

function parseTools(formData: FormData): AiEmployeeTool[] {
  const selected = formData.getAll('tools').map(String);

  return AVAILABLE_TOOLS.map((tool) => ({
    id: tool.id,
    enabled: selected.includes(tool.id),
  }));
}

function buildConfiguration(formData: FormData) {
  return {
    description: getOptionalText(formData.get('description')) ?? undefined,
    temperature: parseNumber(formData.get('temperature'), 0.7),
    max_tokens: parseNumber(formData.get('max_tokens'), 4096),
    top_p: 1,
  };
}

function buildMemory(formData: FormData): AiEmployeeMemory {
  return {
    enabled: parseBoolean(formData.get('memory_enabled')),
    scope: parseMemoryScope(formData.get('memory_scope')),
    retention_days: parseNumber(formData.get('memory_retention_days'), 30),
  };
}

export async function createEmployee(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const name = getOptionalText(formData.get('name'));
  const roleTitle = getOptionalText(formData.get('role_title'));
  const providerId = getOptionalText(formData.get('provider_id'));
  const modelId = getOptionalText(formData.get('model_id'));

  if (!name) {
    throw new Error('Name is required');
  }

  if (!roleTitle) {
    throw new Error('Role is required');
  }

  if (!providerId || !modelId) {
    throw new Error('Provider and model are required');
  }

  const status = parseStatus(formData.get('status'));
  const isActive = status === 'active';

  const { error } = await supabase.from('ai_employees').insert({
    organization_id: organizationId,
    name,
    role_title: roleTitle,
    provider_id: providerId,
    model_id: modelId,
    system_prompt: getOptionalText(formData.get('system_prompt')),
    configuration: buildConfiguration(formData),
    memory: buildMemory(formData),
    tools: parseTools(formData),
    status,
    is_active: isActive,
    created_by: user.id,
  });

  if (error) {
    throw error;
  }

  revalidatePath('/ai-employees');
}

export async function updateEmployee(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const id = getOptionalText(formData.get('id'));

  if (!id) {
    throw new Error('Employee id is required');
  }

  const name = getOptionalText(formData.get('name'));
  const roleTitle = getOptionalText(formData.get('role_title'));
  const providerId = getOptionalText(formData.get('provider_id'));
  const modelId = getOptionalText(formData.get('model_id'));

  if (!name) {
    throw new Error('Name is required');
  }

  if (!roleTitle) {
    throw new Error('Role is required');
  }

  if (!providerId || !modelId) {
    throw new Error('Provider and model are required');
  }

  const status = parseStatus(formData.get('status'));

  const { error } = await supabase
    .from('ai_employees')
    .update({
      name,
      role_title: roleTitle,
      provider_id: providerId,
      model_id: modelId,
      system_prompt: getOptionalText(formData.get('system_prompt')),
      configuration: buildConfiguration(formData),
      memory: buildMemory(formData),
      tools: parseTools(formData),
      status,
      is_active: status === 'active',
      updated_by: user.id,
    })
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  revalidatePath('/ai-employees');
  revalidatePath(`/ai-employees/${id}`);
}

export async function toggleEmployee(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const id = getOptionalText(formData.get('id'));

  if (!id) {
    throw new Error('Employee id is required');
  }

  const { data: employee, error: fetchError } = await supabase
    .from('ai_employees')
    .select('status, is_active')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!employee) {
    throw new Error('Employee not found');
  }

  const nextActive = !(employee.status === 'active' && employee.is_active);
  const nextStatus: AiEmployeeStatus = nextActive ? 'active' : 'inactive';

  const { error } = await supabase
    .from('ai_employees')
    .update({
      status: nextStatus,
      is_active: nextActive,
      updated_by: user.id,
    })
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  revalidatePath('/ai-employees');
  revalidatePath(`/ai-employees/${id}`);
}

export async function deleteEmployee(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const id = getOptionalText(formData.get('id'));

  if (!id) {
    throw new Error('Employee id is required');
  }

  const { error } = await supabase
    .from('ai_employees')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  revalidatePath('/ai-employees');
}
