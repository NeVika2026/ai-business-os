'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createEmployee, updateEmployee } from '@/app/(dashboard)/ai-employees/actions';
import { ModelSelect } from '@/components/ai/model-select';
import { ProviderSelect } from '@/components/ai/provider-select';
import type { AiEmployee, AiModel, AiProvider } from '@/types/ai';
import {
  AI_EMPLOYEE_STATUSES,
  AI_EMPLOYEE_STATUS_LABELS,
  AVAILABLE_TOOLS,
  MEMORY_SCOPES,
  MEMORY_SCOPE_LABELS,
} from '@/types/ai';

type EmployeeFormProps = {
  open: boolean;
  mode: 'create' | 'edit';
  employee?: AiEmployee | null;
  providers: AiProvider[];
  models: AiModel[];
  onClose: () => void;
};

function getInitialProviderId(employee: AiEmployee | null | undefined, providers: AiProvider[]) {
  return employee?.provider_id ?? providers[0]?.id ?? '';
}

function getInitialModelId(employee: AiEmployee | null | undefined, models: AiModel[]) {
  if (employee?.model_id) {
    return employee.model_id;
  }

  const providerId = employee?.provider_id ?? models[0]?.provider_id;

  if (!providerId) {
    return '';
  }

  return models.find((model) => model.provider_id === providerId)?.id ?? '';
}

function isToolEnabled(employee: AiEmployee | null | undefined, toolId: string) {
  return employee?.tools.some((tool) => tool.id === toolId && tool.enabled) ?? false;
}

export function EmployeeForm({
  open,
  mode,
  employee,
  providers,
  models,
  onClose,
}: EmployeeFormProps) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [providerId, setProviderId] = useState(() => getInitialProviderId(employee, providers));
  const [modelId, setModelId] = useState(() => getInitialModelId(employee, models));

  function handleProviderChange(nextProviderId: string) {
    setProviderId(nextProviderId);
    const firstModel = models.find(
      (model) => model.provider_id === nextProviderId && model.is_active,
    );
    setModelId(firstModel?.id ?? '');
  }

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleSubmit(formData: FormData) {
    formData.set('provider_id', providerId);
    formData.set('model_id', modelId);

    if (mode === 'create') {
      await createEmployee(formData);
    } else {
      await updateEmployee(formData);
    }

    onClose();
    router.refresh();
  }

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-full max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-0 text-[var(--text-primary)] backdrop:bg-black/50"
      onClose={onClose}
    >
      <form action={handleSubmit} className="max-h-[85vh] space-y-5 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {mode === 'create' ? 'Новый AI сотрудник' : 'Редактировать AI сотрудника'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            ✕
          </button>
        </div>

        {mode === 'edit' && employee ? <input type="hidden" name="id" value={employee.id} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-[var(--text-secondary)]">Название *</span>
            <input
              name="name"
              required
              defaultValue={employee?.name ?? ''}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-[var(--text-secondary)]">Описание</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={employee?.configuration.description ?? ''}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Роль</span>
            <input
              name="role_title"
              required
              defaultValue={employee?.role_title ?? ''}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Status</span>
            <select
              name="status"
              defaultValue={employee?.status ?? 'active'}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {AI_EMPLOYEE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {AI_EMPLOYEE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <ProviderSelect
            providers={providers}
            value={providerId}
            onChange={handleProviderChange}
          />

          <ModelSelect
            models={models}
            providerId={providerId}
            value={modelId}
            onChange={setModelId}
          />

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-[var(--text-secondary)]">System Prompt</span>
            <textarea
              name="system_prompt"
              rows={4}
              defaultValue={employee?.system_prompt ?? ''}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Temperature</span>
            <input
              name="temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              defaultValue={employee?.configuration.temperature ?? 0.7}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Max Tokens</span>
            <input
              name="max_tokens"
              type="number"
              min="256"
              step="256"
              defaultValue={employee?.configuration.max_tokens ?? 4096}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>
        </div>

        <fieldset className="space-y-3 rounded-xl border border-[var(--border-subtle)] p-4">
          <legend className="px-1 text-sm font-medium text-[var(--text-primary)]">Memory</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="memory_enabled"
              type="checkbox"
              defaultChecked={employee?.memory.enabled ?? true}
              className="rounded border-[var(--border-subtle)]"
            />
            <span>Включить память</span>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Scope</span>
            <select
              name="memory_scope"
              defaultValue={employee?.memory.scope ?? 'ai_employee'}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {MEMORY_SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  {MEMORY_SCOPE_LABELS[scope]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Retention (days)</span>
            <input
              name="memory_retention_days"
              type="number"
              min="1"
              defaultValue={employee?.memory.retention_days ?? 30}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-[var(--border-subtle)] p-4">
          <legend className="px-1 text-sm font-medium text-[var(--text-primary)]">Tools</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {AVAILABLE_TOOLS.map((tool) => (
              <label key={tool.id} className="flex items-center gap-2 text-sm">
                <input
                  name="tools"
                  type="checkbox"
                  value={tool.id}
                  defaultChecked={isToolEnabled(employee, tool.id)}
                  className="rounded border-[var(--border-subtle)]"
                />
                <span>{tool.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Сохранить
          </button>
        </div>
      </form>
    </dialog>
  );
}
