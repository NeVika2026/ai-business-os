import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { EmployeeMemory } from '@/components/ai/employee-memory';
import { EmployeeRuns } from '@/components/ai/employee-runs';
import { EmployeeStatusBadge } from '@/components/ai/employee-status';
import { ExecuteButton } from '@/components/orchestrator/execute-button';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import {
  EMPLOYEE_SELECT,
  formatDateTime,
  formatMemorySummary,
  formatToolsSummary,
  mapAgentMemories,
  mapAgentRuns,
  mapAiEmployees,
} from '@/utils/ai/employees';
import { AVAILABLE_TOOLS, MEMORY_SCOPE_LABELS } from '@/types/ai';
import type { MemoryScope } from '@/types/ai';

type EmployeeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const { data: employeeRow, error: employeeError } = await supabase
    .from('ai_employees')
    .select(EMPLOYEE_SELECT)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (employeeError) {
    throw employeeError;
  }

  if (!employeeRow) {
    notFound();
  }

  const [employee] = mapAiEmployees([employeeRow]);

  const [{ data: runsData, error: runsError }, { data: memoriesData, error: memoriesError }] =
    await Promise.all([
      supabase
        .from('agent_runs')
        .select(
          `
        id,
        organization_id,
        ai_employee_id,
        status,
        input,
        output,
        tokens_input,
        tokens_output,
        error_message,
        started_at,
        completed_at,
        created_at
      `,
        )
        .eq('ai_employee_id', id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('agent_memories')
        .select(
          `
        id,
        organization_id,
        ai_employee_id,
        scope,
        content,
        importance,
        last_used_at,
        created_at
      `,
        )
        .eq('ai_employee_id', id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

  if (runsError) {
    throw runsError;
  }

  if (memoriesError) {
    throw memoriesError;
  }

  const runs = mapAgentRuns(runsData ?? []);
  const memories = mapAgentMemories(memoriesData ?? []);
  const memoryScope = employee.memory.scope as MemoryScope | undefined;
  const canExecute = employee.status === 'active' && employee.is_active;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/ai-employees"
          className="text-sm text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          ← AI Employees
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{employee.name}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{employee.role_title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <EmployeeStatusBadge status={employee.status} isActive={employee.is_active} />
            <ExecuteButton aiEmployeeId={employee.id} disabled={!canExecute} />
          </div>
        </div>
      </div>

      <section className="grid gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Provider</p>
          <p className="mt-1 text-[var(--text-primary)]">{employee.provider?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Model</p>
          <p className="mt-1 text-[var(--text-primary)]">{employee.model?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Создан</p>
          <p className="mt-1 text-[var(--text-primary)]">{formatDateTime(employee.created_at)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Обновлён</p>
          <p className="mt-1 text-[var(--text-primary)]">{formatDateTime(employee.updated_at)}</p>
        </div>
        {employee.configuration.description ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-[var(--text-secondary)]">Описание</p>
            <p className="mt-1 text-[var(--text-primary)]">{employee.configuration.description}</p>
          </div>
        ) : null}
        {employee.system_prompt ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-[var(--text-secondary)]">System Prompt</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
              {employee.system_prompt}
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Configuration</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Temperature</dt>
              <dd>{employee.configuration.temperature ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Max Tokens</dt>
              <dd>{employee.configuration.max_tokens ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Top P</dt>
              <dd>{employee.configuration.top_p ?? '—'}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Memory</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Статус</dt>
              <dd>{formatMemorySummary(employee.memory)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Scope</dt>
              <dd>
                {memoryScope && memoryScope in MEMORY_SCOPE_LABELS
                  ? MEMORY_SCOPE_LABELS[memoryScope]
                  : (employee.memory.scope ?? '—')}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Retention</dt>
              <dd>{employee.memory.retention_days ?? '—'} days</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Tools</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {AVAILABLE_TOOLS.map((tool) => {
              const enabled = employee.tools.some(
                (employeeTool) => employeeTool.id === tool.id && employeeTool.enabled,
              );

              return (
                <li key={tool.id} className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-primary)]">{tool.label}</span>
                  <span className={enabled ? 'text-emerald-300' : 'text-[var(--text-secondary)]'}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-[var(--text-secondary)]">
            Summary: {formatToolsSummary(employee.tools)}
          </p>
        </article>
      </section>

      <EmployeeRuns runs={runs} />
      <EmployeeMemory memories={memories} />
    </div>
  );
}
