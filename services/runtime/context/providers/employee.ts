import type { UUID } from '@/types/runtime/dto';
import type { EmployeeProviderResult } from '@/services/runtime/context/types';

const MOCK_EMPLOYEES: Record<string, EmployeeProviderResult> = {
  default: {
    id: 'c1000001-0000-4000-8000-000000000001',
    name: 'Alex CEO',
    roleTitle: 'Chief Executive Officer',
    systemPrompt: 'You orchestrate marketing and sales workflows.',
    configuration: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
    },
    tools: [
      { id: 'web_search', enabled: true },
      { id: 'crm_read', enabled: true },
    ],
    permissions: {
      can_create_tasks: true,
      can_update_leads: true,
    },
    provider: {
      id: 'a1000001-0000-4000-8000-000000000001',
      code: 'openai',
    },
    model: {
      id: 'a2000001-0000-4000-8000-000000000001',
      code: 'gpt-4o',
      contextWindow: 128000,
      supportsTools: true,
    },
  },
};

export function fetchEmployee(employeeId: UUID, organizationId: UUID): EmployeeProviderResult {
  void organizationId;

  return {
    ...MOCK_EMPLOYEES.default,
    id: employeeId,
  };
}
