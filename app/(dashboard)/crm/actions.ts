'use server';

import { revalidatePath } from 'next/cache';

import type { LeadStatus } from '@/types/crm';
import { LEAD_STATUSES } from '@/types/crm';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

function parseLeadStatus(value: FormDataEntryValue | null): LeadStatus {
  if (typeof value === 'string' && LEAD_STATUSES.includes(value as LeadStatus)) {
    return value as LeadStatus;
  }

  return 'new';
}

function getOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createLead(formData: FormData) {
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

  if (!name) {
    throw new Error('Name is required');
  }

  const { error } = await supabase.from('crm_leads').insert({
    organization_id: organizationId,
    name,
    phone: getOptionalText(formData.get('phone')),
    email: getOptionalText(formData.get('email')),
    source: getOptionalText(formData.get('source')),
    status: parseLeadStatus(formData.get('status')),
    notes: getOptionalText(formData.get('notes')),
    created_by: user.id,
  });

  if (error) {
    throw error;
  }

  revalidatePath('/crm');
}

export async function updateLead(formData: FormData) {
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
    throw new Error('Lead id is required');
  }

  const name = getOptionalText(formData.get('name'));

  if (!name) {
    throw new Error('Name is required');
  }

  const { error } = await supabase
    .from('crm_leads')
    .update({
      name,
      phone: getOptionalText(formData.get('phone')),
      email: getOptionalText(formData.get('email')),
      source: getOptionalText(formData.get('source')),
      status: parseLeadStatus(formData.get('status')),
      notes: getOptionalText(formData.get('notes')),
      updated_by: user.id,
    })
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  revalidatePath('/crm');
}

export async function deleteLead(formData: FormData) {
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
    throw new Error('Lead id is required');
  }

  const { error } = await supabase
    .from('crm_leads')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  revalidatePath('/crm');
}


export async function updateLeadStatusQuick(
  leadId: string,
  status: LeadStatus,
) {
  if (!LEAD_STATUSES.includes(status)) {
    throw new Error('Invalid lead status');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Organization not found');

  const updates: Record<string, unknown> = {
    status,
    updated_by: user.id,
  };

  if (status === 'contacted' || status === 'qualified') {
    updates.last_contact_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('crm_leads')
    .update(updates)
    .eq('id', leadId)
    .eq('organization_id', organizationId);

  if (error) throw error;

  revalidatePath('/crm');
}


export async function scheduleLeadFollowUp(
  leadId: string,
  daysFromNow: 1 | 3 | 7,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Organization not found');

  const { data: lead, error: leadError } = await supabase
    .from('crm_leads')
    .select('id, name, project_id')
    .eq('organization_id', organizationId)
    .eq('id', leadId)
    .maybeSingle();

  if (leadError) throw leadError;
  if (!lead) throw new Error('Lead not found');

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + daysFromNow);
  dueAt.setHours(11, 0, 0, 0);

  const marker = 'CRM_LEAD_ID:' + lead.id;

  const { data: existingTask } = await supabase
    .from('tasks')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'todo')
    .ilike('description', '%' + marker + '%')
    .maybeSingle();

  if (existingTask?.id) {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: 'Связаться: ' + lead.name,
        due_at: dueAt.toISOString(),
        priority: 2,
        updated_by: user.id,
      })
      .eq('id', existingTask.id)
      .eq('organization_id', organizationId);

    if (error) throw error;
  } else {
    const { error } = await supabase.from('tasks').insert({
      organization_id: organizationId,
      project_id: lead.project_id,
      title: 'Связаться: ' + lead.name,
      description: marker + '\nCRM follow-up',
      status: 'todo',
      priority: 2,
      due_at: dueAt.toISOString(),
      created_by: user.id,
    });

    if (error) throw error;
  }

  revalidatePath('/crm');

  return {
    leadId: lead.id,
    dueAt: dueAt.toISOString(),
  };
}
