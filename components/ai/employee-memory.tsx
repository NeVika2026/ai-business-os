import type { AgentMemory } from '@/types/ai';
import { formatDateTime } from '@/utils/ai/employees';

type EmployeeMemoryProps = {
  memories: AgentMemory[];
};

export function EmployeeMemory({ memories }: EmployeeMemoryProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Последние Memories</h2>
        <p className="text-sm text-[var(--text-secondary)]">Из agent_memories</p>
      </div>

      {memories.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
          Записей памяти пока нет.
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => (
            <article
              key={memory.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span>Scope: {memory.scope}</span>
                <span>Importance: {memory.importance.toFixed(2)}</span>
                <span>{formatDateTime(memory.created_at)}</span>
              </div>
              <p className="text-sm text-[var(--text-primary)]">{memory.content}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
