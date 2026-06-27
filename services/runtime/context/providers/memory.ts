import type { UUID } from '@/types/runtime/dto';
import type { MemoryProviderResult } from '@/services/runtime/context/types';

export function fetchMemory(organizationId: UUID, employeeId: UUID): MemoryProviderResult {
  void organizationId;
  void employeeId;

  // Production path: no mock data. Real memory is injected via RuntimeMemoryContext when enabled.
  return {
    semantic: [],
    working: [],
  };
}
