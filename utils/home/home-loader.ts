import type { SupabaseClient } from '@supabase/supabase-js';

import { getDashboardContext } from '@/utils/auth/onboarding';
import { loadCabinetRawSnapshot } from '@/utils/cabinet/load-dashboard';
import { buildHomeFromSnapshot, createEmptyHome } from '@/utils/home/home-mappers';
import type { HomeData, HomeUserContext } from '@/utils/home/home-types';

export async function loadHomeUserContext(
  supabase: SupabaseClient,
): Promise<HomeUserContext | null> {
  const context = await getDashboardContext(supabase);

  if (!context) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  return {
    email: context.email,
    organizationName: context.organizationName,
    userName: profile?.full_name ?? null,
  };
}

export async function loadHomeData(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<HomeData | null> {
  const context = await loadHomeUserContext(supabase);

  if (!context) {
    return null;
  }

  try {
    const snapshot = await loadCabinetRawSnapshot(supabase, organizationId, context.email);

    return buildHomeFromSnapshot(snapshot, context);
  } catch {
    return createEmptyHome(context);
  }
}

export { loadCabinetRawSnapshot };
