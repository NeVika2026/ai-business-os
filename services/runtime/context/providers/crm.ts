import type { UUID } from '@/types/runtime/dto';
import type { CrmProviderResult } from '@/services/runtime/context/types';

export function fetchCrm(organizationId: UUID): CrmProviderResult {
  void organizationId;

  return {
    leads: [
      {
        id: 'f1000001-0000-4000-8000-000000000001',
        name: 'Ivan Petrov',
        status: 'qualified',
        email: 'ivan@example.com',
        notes: 'Interested in AI Employees module.',
      },
      {
        id: 'f1000002-0000-4000-8000-000000000002',
        name: 'Maria Sokolova',
        status: 'new',
        phone: '+7 900 000-00-01',
        notes: 'Requested product demo.',
      },
      {
        id: 'f1000003-0000-4000-8000-000000000003',
        name: 'Alex Kim',
        status: 'contacted',
        email: 'alex@example.com',
      },
    ],
    customers: [
      {
        id: 'cust-0001',
        name: 'Acme LLC',
      },
    ],
    notes: ['Follow up with qualified leads within 24 hours.'],
  };
}
