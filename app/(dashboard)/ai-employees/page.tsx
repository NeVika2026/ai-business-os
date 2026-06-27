import { redirect } from 'next/navigation';

import { EmployeeGrid } from '@/components/ai/employee-grid';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import {
  buildLastRunMap,
  computeAiEmployeeStats,
  EMPLOYEE_SELECT,
  mapAiEmployees,
} from '@/utils/ai/employees';

export default async function AiEmployeesPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const [
    { data: employeesData, error: employeesError },
    { data: providersData, error: providersError },
    { data: modelsData, error: modelsError },
    { data: runsData, error: runsError },
  ] = await Promise.all([
    supabase
      .from('ai_employees')
      .select(EMPLOYEE_SELECT)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false }),
    supabase
      .from('ai_providers')
      .select('id, code, name, website, is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('ai_models')
      .select('id, provider_id, code, name, context_window, supports_tools, is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('agent_runs')
      .select('ai_employee_id, completed_at, started_at, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false }),
  ]);

  if (employeesError) {
    throw employeesError;
  }

  if (providersError) {
    throw providersError;
  }

  if (modelsError) {
    throw modelsError;
  }

  if (runsError) {
    throw runsError;
  }

  const lastRunByEmployee = buildLastRunMap(runsData ?? []);
  const employees = mapAiEmployees(employeesData ?? [], lastRunByEmployee);
  const stats = computeAiEmployeeStats(employees);

  return (
    <EmployeeGrid
      employees={employees}
      stats={stats}
      providers={providersData ?? []}
      models={modelsData ?? []}
    />
  );
}
