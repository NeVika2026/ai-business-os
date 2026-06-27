import type { UUID } from '@/types/runtime/dto';
import type { MemoryProviderResult } from '@/services/runtime/context/types';

export function fetchMemory(organizationId: UUID, employeeId: UUID): MemoryProviderResult {
  void organizationId;

  return {
    semantic: [
      {
        id: '08000001-0000-4000-8000-000000000001',
        scope: 'organization',
        content: 'Q2 campaign target audience: SMB in CIS region.',
        importance: 0.65,
      },
      {
        id: '08000002-0000-4000-8000-000000000002',
        scope: 'ai_employee',
        content: 'Lead Ivan prefers Telegram communication.',
        importance: 0.8,
      },
    ],
    working: [
      {
        id: '08000003-0000-4000-8000-000000000003',
        scope: 'ai_employee',
        content: `Recent focus for employee ${employeeId}: follow up on inbound leads.`,
        importance: 0.55,
      },
    ],
  };
}
