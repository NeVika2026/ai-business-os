import type { SupabaseClient } from '@supabase/supabase-js';

export async function ensureUserOnboarding(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingProfile) {
    const fullName =
      typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;
    const avatarUrl =
      typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null;

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
    });

    if (error) {
      throw error;
    }
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    const { error } = await supabase.from('organizations').insert({
      name: 'My Organization',
      created_by: user.id,
    });

    if (error) {
      throw error;
    }
  }
}

export type DashboardContext = {
  email: string;
  organizationName: string;
};

export async function getDashboardContext(
  supabase: SupabaseClient,
): Promise<DashboardContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organizations(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const organization = membership?.organizations as { name: string } | null | undefined;

  return {
    email: user.email ?? '',
    organizationName: organization?.name ?? 'My Organization',
  };
}
