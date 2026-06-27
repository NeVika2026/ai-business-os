'use client';

import { useState } from 'react';

import { EmployeeCard } from '@/components/ai/employee-card';
import { EmployeeForm } from '@/components/ai/employee-form';
import type { AiEmployee, AiEmployeeStats, AiModel, AiProvider } from '@/types/ai';

type EmployeeGridProps = {
  employees: AiEmployee[];
  stats: AiEmployeeStats;
  providers: AiProvider[];
  models: AiModel[];
};

const STAT_CARDS: { key: keyof AiEmployeeStats; label: string }[] = [
  { key: 'totalEmployees', label: 'Всего сотрудников' },
  { key: 'activeEmployees', label: 'Активных' },
  { key: 'disabledEmployees', label: 'Выключенных' },
  { key: 'providersUsed', label: 'Провайдеров' },
  { key: 'modelsUsed', label: 'Используемых моделей' },
];

export function EmployeeGrid({ employees, stats, providers, models }: EmployeeGridProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<AiEmployee | null>(null);

  function openCreateForm() {
    setFormMode('create');
    setSelectedEmployee(null);
    setFormOpen(true);
  }

  function openEditForm(employee: AiEmployee) {
    setFormMode('edit');
    setSelectedEmployee(employee);
    setFormOpen(true);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">AI Employees</h1>
          <p className="text-sm text-[var(--text-secondary)]">Цифровая команда AI-сотрудников</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          + AI сотрудник
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <article
            key={card.key}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
          >
            <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {stats[card.key]}
            </p>
          </article>
        ))}
      </div>

      {employees.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
          AI-сотрудников пока нет. Создайте первого цифрового сотрудника.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} onEdit={openEditForm} />
          ))}
        </div>
      )}

      <EmployeeForm
        key={selectedEmployee?.id ?? 'create'}
        open={formOpen}
        mode={formMode}
        employee={selectedEmployee}
        providers={providers}
        models={models}
        onClose={() => setFormOpen(false)}
      />
    </section>
  );
}
