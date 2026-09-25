'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createAdminClient } from '@/services/supabase/admin';
import { createClient } from '@/services/supabase/server';
import { requireOrganizationAdmin } from '@/utils/auth/authorization';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

type ManageableRole = 'admin' | 'member';

function normalizeEmail(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function normalizeRole(value: FormDataEntryValue | null): ManageableRole | null {
  return value === 'admin' || value === 'member' ? value : null;
}

function teamRedirect(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect('/settings/team?' + search.toString());
}

async function resolveCurrentOrganization() {
  const supabase = await createClient();
  await requireOrganizationAdmin();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    teamRedirect({ error: 'organization_missing' });
  }

  return { supabase, organizationId };
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;

    if (data.users.length < 200) break;
  }

  return null;
}

export async function inviteTeamMemberAction(formData: FormData) {
  const email = normalizeEmail(formData.get('email'));
  const role = normalizeRole(formData.get('role'));

  if (!email || !role) {
    teamRedirect({ error: 'invalid_invite' });
  }

  const { supabase, organizationId } = await resolveCurrentOrganization();
  const admin = createAdminClient();

  let user = await findAuthUserByEmail(email);

  if (!user) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { invited_to_business_factory: true },
    });

    if (error || !data.user) {
      teamRedirect({ error: 'invite_failed' });
    }

    user = data.user;
  }

  const { data: existing } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    teamRedirect({ error: 'already_member' });
  }

  const { error } = await supabase.from('organization_members').insert({
    organization_id: organizationId,
    user_id: user.id,
    role,
  });

  if (error) {
    teamRedirect({ error: 'membership_failed' });
  }

  revalidatePath('/settings/team');
  teamRedirect({ invited: '1' });
}

export async function updateTeamMemberRoleAction(formData: FormData) {
  const userId = typeof formData.get('user_id') === 'string'
    ? String(formData.get('user_id')).trim()
    : '';
  const role = normalizeRole(formData.get('role'));

  if (!userId || !role) {
    teamRedirect({ error: 'invalid_role' });
  }

  const { supabase, organizationId } = await resolveCurrentOrganization();

  const { data: target } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!target || target.role === 'owner') {
    teamRedirect({ error: 'owner_protected' });
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  if (error) {
    teamRedirect({ error: 'role_failed' });
  }

  revalidatePath('/settings/team');
  teamRedirect({ updated: '1' });
}

export async function removeTeamMemberAction(formData: FormData) {
  const userId = typeof formData.get('user_id') === 'string'
    ? String(formData.get('user_id')).trim()
    : '';

  if (!userId) {
    teamRedirect({ error: 'invalid_member' });
  }

  const { supabase, organizationId } = await resolveCurrentOrganization();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (currentUser?.id === userId) {
    teamRedirect({ error: 'self_remove' });
  }

  const { data: target } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!target || target.role === 'owner') {
    teamRedirect({ error: 'owner_protected' });
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  if (error) {
    teamRedirect({ error: 'remove_failed' });
  }

  revalidatePath('/settings/team');
  teamRedirect({ removed: '1' });
}
