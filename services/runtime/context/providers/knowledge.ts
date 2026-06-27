import type { UUID } from '@/types/runtime/dto';
import type { KnowledgeProviderResult } from '@/services/runtime/context/types';

export function fetchKnowledge(organizationId: UUID, query: string): KnowledgeProviderResult {
  void organizationId;

  return {
    items: [
      {
        id: '01000001-0000-4000-8000-000000000001',
        title: 'Sales Playbook',
        type: 'pdf',
      },
      {
        id: '01000002-0000-4000-8000-000000000002',
        title: 'Product FAQ',
        type: 'manual',
      },
    ],
    chunks: [
      {
        chunkId: '07000001-0000-4000-8000-000000000001',
        itemId: '01000001-0000-4000-8000-000000000001',
        sourceId: '01000001-0000-4000-8000-000000000001',
        sourceTitle: 'Sales Playbook',
        content: 'Qualify leads using BANT before proposing a demo.',
      },
      {
        chunkId: '07000002-0000-4000-8000-000000000002',
        itemId: '01000002-0000-4000-8000-000000000002',
        sourceId: '01000002-0000-4000-8000-000000000002',
        sourceTitle: 'Product FAQ',
        content: 'AI Business OS supports CRM, Knowledge Hub, and AI Employees.',
      },
      {
        chunkId: '07000003-0000-4000-8000-000000000003',
        itemId: '01000001-0000-4000-8000-000000000001',
        sourceId: '01000001-0000-4000-8000-000000000001',
        sourceTitle: 'Sales Playbook',
        content: `Context query reference: ${query}`,
      },
    ],
  };
}
