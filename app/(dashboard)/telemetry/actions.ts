'use server';

import { trackProductTelemetry } from '@/lib/telemetry/product-telemetry';
import { createClient } from '@/services/supabase/server';
import type { ProductTelemetryEvent } from '@/types/product-telemetry';

export async function trackProductEvent(input: {
  event: ProductTelemetryEvent;
  projectId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  trackProductTelemetry({
    projectId: input.projectId ?? null,
    event: input.event,
    actor: `user:${user.email ?? user.id}`,
    payload: input.payload,
  });
}
