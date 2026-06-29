import type { SupabaseClient } from '@supabase/supabase-js';

import { loadCabinetRawSnapshot } from '@/utils/cabinet/load-dashboard';
import {
  buildConciergeFromSnapshot,
  createEmptyConcierge,
  type ConciergeData,
} from '@/utils/home/concierge-mappers';
import { loadHomeUserContext } from '@/utils/home/home-loader';

export type HomePageConciergeLoadResult =
  | { status: 'ok'; data: ConciergeData }
  | { status: 'fallback' }
  | { status: 'unauthorized' };

export function resolveHomePageLoadResult(
  hasAuthenticatedUser: boolean,
  conciergeData: ConciergeData | null,
): HomePageConciergeLoadResult {
  if (!hasAuthenticatedUser) {
    return { status: 'unauthorized' };
  }

  if (!conciergeData) {
    return { status: 'fallback' };
  }

  return { status: 'ok', data: conciergeData };
}

export async function loadConciergeData(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ConciergeData | null> {
  try {
    const context = await loadHomeUserContext(supabase);

    if (!context) {
      return null;
    }

    try {
      const snapshot = await loadCabinetRawSnapshot(supabase, organizationId, context.email);

      return buildConciergeFromSnapshot(snapshot, context);
    } catch {
      return createEmptyConcierge(context);
    }
  } catch {
    return null;
  }
}

export async function loadHomePageConcierge(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<HomePageConciergeLoadResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 'unauthorized' };
  }

  try {
    const data = await loadConciergeData(supabase, organizationId);

    return resolveHomePageLoadResult(true, data);
  } catch {
    return resolveHomePageLoadResult(true, null);
  }
}

export { loadHomeUserContext, loadCabinetRawSnapshot };
