import type { SupabaseClient } from '@supabase/supabase-js';

import { OSA_COORDINATOR_EMPLOYEE_ID } from '@/utils/osa/osa-task';

export const OSA_COORDINATOR_ROLE_TITLE = 'OSA Navigator';
export const OSA_COORDINATOR_NAME = 'OSA Navigator';

export async function resolveOsaCoordinatorEmployeeId(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<string | null> {
  const { data: byId, error: byIdError } = await supabase
    .from('ai_employees')
    .select('id')
    .eq('id', OSA_COORDINATOR_EMPLOYEE_ID)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (byIdError) {
    throw byIdError;
  }

  if (byId?.id) {
    return byId.id;
  }

  const { data: byRole, error: byRoleError } = await supabase
    .from('ai_employees')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('role_title', OSA_COORDINATOR_ROLE_TITLE)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (byRoleError) {
    throw byRoleError;
  }

  return byRole?.id ?? null;
}
