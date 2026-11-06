export type DataResidencyReadinessInput = {
  supabaseUrl?: string;
  declaredRegion?: string;
};

export type DataResidencyReadiness = {
  ready: boolean;
  reason: 'foreign_supabase_cloud' | 'region_not_declared_ru' | 'invalid_supabase_url' | null;
};

function isHostedSupabaseCloud(hostname: string) {
  return hostname.endsWith('.supabase.co');
}

export function getDataResidencyReadiness(
  input: DataResidencyReadinessInput,
): DataResidencyReadiness {
  if (input.declaredRegion !== 'RU') {
    return { ready: false, reason: 'region_not_declared_ru' };
  }

  if (!input.supabaseUrl) {
    return { ready: false, reason: 'invalid_supabase_url' };
  }

  let url: URL;
  try {
    url = new URL(input.supabaseUrl);
  } catch {
    return { ready: false, reason: 'invalid_supabase_url' };
  }

  if (isHostedSupabaseCloud(url.hostname)) {
    return { ready: false, reason: 'foreign_supabase_cloud' };
  }

  return { ready: true, reason: null };
}
