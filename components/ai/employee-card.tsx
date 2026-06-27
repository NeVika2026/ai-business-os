'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toggleEmployee } from '@/app/(dashboard)/ai-employees/actions';
import { EmployeeStatusBadge } from '@/components/ai/employee-status';
import type { AiEmployee } from '@/types/ai';
import { formatDateTime, formatMemorySummary, formatToolsSummary } from '@/utils/ai/employees';

type EmployeeCardProps = {
  employee: AiEmployee;
  onEdit: (employee: AiEmployee) => void;
};

export function EmployeeCard({ employee, onEdit }: EmployeeCardProps) {
  const router = useRouter();
  const isEnabled = employee.status === 'active' && employee.is_active;

  async function handleToggle(formData: FormData) {
    await toggleEmployee(formData);
    router.refresh();
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{employee.name}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{employee.role_title}</p>
        </div>
        <EmployeeStatusBadge status={employee.status} isActive={employee.is_active} />
      </div>

      <dl className="mb-5 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">Provider</dt>
          <dd className="text-right text-[var(--text-primary)]">
            {employee.provider?.name ?? '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">Model</dt>
          <dd className="text-right text-[var(--text-primary)]">{employee.model?.name ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">Memory</dt>
          <dd className="text-right text-[var(--text-primary)]">
            {formatMemorySummary(employee.memory)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">Tools</dt>
          <dd className="text-right text-[var(--text-primary)]">
            {formatToolsSummary(employee.tools)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">Последний запуск</dt>
          <dd className="text-right text-[var(--text-primary)]">
            {formatDateTime(employee.last_run_at)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          href={`/ai-employees/${employee.id}`}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Открыть
        </Link>
        <button
          type="button"
          onClick={() => onEdit(employee)}
          className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Редактировать
        </button>
        <form action={handleToggle}>
          <input type="hidden" name="id" value={employee.id} />
          <button
            type="submit"
            className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {isEnabled ? 'Отключить' : 'Включить'}
          </button>
        </form>
      </div>
    </article>
  );
}
