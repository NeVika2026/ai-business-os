import type { UUID } from '@/types/runtime/dto';
import type { OrganizationContext } from '@/services/runtime/context/types';

export function fetchOrganization(organizationId: UUID): OrganizationContext {
  return {
    id: organizationId,
    name: 'Demo Organization',
    timezone: 'Europe/Moscow',
    locale: 'ru-RU',
  };
}
