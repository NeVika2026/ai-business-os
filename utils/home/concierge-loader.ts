import type { SupabaseClient } from '@supabase/supabase-js';

import { loadCabinetRawSnapshot } from '@/utils/cabinet/load-dashboard';
import {
  buildConciergeFromSnapshot,
  createEmptyConcierge,
  type ConciergeData,
} from '@/utils/home/concierge-mappers';
import { loadHomeUserContext } from '@/utils/home/home-loader';

export async function loadConciergeData(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ConciergeData | null> {
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
}

export { loadHomeUserContext, loadCabinetRawSnapshot };
