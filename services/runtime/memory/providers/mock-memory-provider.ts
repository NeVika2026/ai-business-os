import type {
  MemoryKind,
  MemoryProvider,
  MemoryStoreInput,
  StoredMemoryEntry,
} from '@/services/runtime/memory/memory-types';
import type { ISODateTime, UUID } from '@/types/runtime/dto';

const MOCK_RETRIEVED_AT: ISODateTime = '2026-01-01T00:00:00.000Z';

function createId(prefix: string): UUID {
  const suffix = Math.random().toString(16).slice(2, 10);
  return `${prefix}${suffix}-0000-4000-8000-000000000000`.slice(0, 36);
}

function seedEntries(organizationId: UUID, employeeId: UUID): StoredMemoryEntry[] {
  return [
    {
      id: '08000001-0000-4000-8000-000000000001',
      organizationId,
      employeeId,
      kind: 'semantic',
      scope: 'organization',
      content: 'Q2 campaign target audience: SMB in CIS region.',
      importance: 0.65,
      payload: { source: 'seed', topic: 'campaign' },
      createdAt: MOCK_RETRIEVED_AT,
      updatedAt: MOCK_RETRIEVED_AT,
      lastUsedAt: MOCK_RETRIEVED_AT,
    },
    {
      id: '08000002-0000-4000-8000-000000000002',
      organizationId,
      employeeId,
      kind: 'semantic',
      scope: 'ai_employee',
      content: 'Lead Ivan prefers Telegram communication.',
      importance: 0.8,
      payload: { source: 'seed', contact: 'Ivan' },
      createdAt: MOCK_RETRIEVED_AT,
      updatedAt: MOCK_RETRIEVED_AT,
      lastUsedAt: MOCK_RETRIEVED_AT,
    },
    {
      id: '08000003-0000-4000-8000-000000000003',
      organizationId,
      employeeId,
      kind: 'working',
      scope: 'ai_employee',
      content: `Recent focus for employee ${employeeId}: follow up on inbound leads.`,
      importance: 0.55,
      payload: { source: 'seed', focus: 'inbound-leads' },
      createdAt: MOCK_RETRIEVED_AT,
      updatedAt: MOCK_RETRIEVED_AT,
      lastUsedAt: MOCK_RETRIEVED_AT,
    },
    {
      id: '08000004-0000-4000-8000-000000000004',
      organizationId,
      employeeId,
      kind: 'episodic',
      scope: 'project',
      content: 'Last run summarized three open CRM leads and scheduled follow-ups.',
      importance: 0.7,
      payload: { source: 'seed', runSummary: true },
      createdAt: MOCK_RETRIEVED_AT,
      updatedAt: MOCK_RETRIEVED_AT,
      lastUsedAt: MOCK_RETRIEVED_AT,
    },
  ];
}

export class MockMemoryProvider implements MemoryProvider {
  private readonly store = new Map<UUID, StoredMemoryEntry[]>();

  ensureSeed(organizationId: UUID, employeeId: UUID): void {
    if (this.store.has(organizationId)) {
      return;
    }

    this.store.set(organizationId, seedEntries(organizationId, employeeId));
  }

  list(organizationId: UUID, kind?: MemoryKind | MemoryKind[]): StoredMemoryEntry[] {
    const entries = [...(this.store.get(organizationId) ?? [])];

    if (!kind) {
      return entries;
    }

    const kinds = Array.isArray(kind) ? kind : [kind];
    return entries.filter((entry) => kinds.includes(entry.kind));
  }

  upsert(
    organizationId: UUID,
    employeeId: UUID,
    input: MemoryStoreInput,
    now: ISODateTime,
  ): StoredMemoryEntry {
    this.ensureSeed(organizationId, employeeId);
    const entries = this.store.get(organizationId) ?? [];
    const existingIndex = input.id ? entries.findIndex((entry) => entry.id === input.id) : -1;

    if (existingIndex >= 0) {
      const existing = entries[existingIndex];
      const updated: StoredMemoryEntry = {
        ...existing,
        kind: input.kind,
        scope: input.scope,
        content: input.content,
        importance: input.importance,
        payload: input.payload ?? existing.payload,
        updatedAt: input.updatedAt ?? now,
        lastUsedAt: input.lastUsedAt ?? existing.lastUsedAt ?? null,
      };
      entries[existingIndex] = updated;
      this.store.set(organizationId, entries);
      return updated;
    }

    const created: StoredMemoryEntry = {
      id: input.id ?? createId('08'),
      organizationId,
      employeeId,
      kind: input.kind,
      scope: input.scope,
      content: input.content,
      importance: input.importance,
      payload: input.payload ?? {},
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
      lastUsedAt: input.lastUsedAt ?? null,
    };

    entries.push(created);
    this.store.set(organizationId, entries);
    return created;
  }

  replaceAll(organizationId: UUID, entries: StoredMemoryEntry[]): void {
    this.store.set(organizationId, entries);
  }

  countByKind(organizationId: UUID): Record<MemoryKind, number> {
    const entries = this.list(organizationId);
    return {
      working: entries.filter((entry) => entry.kind === 'working').length,
      semantic: entries.filter((entry) => entry.kind === 'semantic').length,
      episodic: entries.filter((entry) => entry.kind === 'episodic').length,
    };
  }

  reset(): void {
    this.store.clear();
  }
}

export function createMockMemoryProvider(): MockMemoryProvider {
  return new MockMemoryProvider();
}

/** Shared in-memory store for local dev and tests. Production runs should prefer per-execution managers. */
export const mockMemoryProvider = createMockMemoryProvider();
