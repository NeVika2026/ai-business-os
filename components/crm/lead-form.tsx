'use client';

import { useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { createLead, updateLead } from '@/app/(dashboard)/crm/actions';
import type { CrmLead, LeadStatus } from '@/types/crm';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@/types/crm';

type LeadFormProps = {
  open: boolean;
  mode: 'create' | 'edit';
  lead?: CrmLead | null;
  onClose: () => void;
};

export function LeadForm({ open, mode, lead, onClose }: LeadFormProps) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

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
    if (mode === 'create') {
      await createLead(formData);
    } else {
      await updateLead(formData);
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
      className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-0 text-[var(--text-primary)] backdrop:bg-black/50"
      onClose={onClose}
    >
      <form action={handleSubmit} className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {mode === 'create' ? 'Новый лид' : 'Редактировать лид'}
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

        {mode === 'edit' && lead ? <input type="hidden" name="id" value={lead.id} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-[var(--text-secondary)]">Имя *</span>
            <input
              name="name"
              required
              defaultValue={lead?.name ?? ''}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Телефон</span>
            <input
              name="phone"
              defaultValue={lead?.phone ?? ''}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Email</span>
            <input
              name="email"
              type="email"
              defaultValue={lead?.email ?? ''}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-[var(--text-secondary)]">Источник</span>
            <input
              name="source"
              defaultValue={lead?.source ?? ''}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-[var(--text-secondary)]">Комментарий</span>
            <textarea
              name="notes"
              rows={4}
              defaultValue={lead?.notes ?? ''}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-[var(--text-secondary)]">Статус</span>
            <select
              name="status"
              defaultValue={(lead?.status ?? 'new') as LeadStatus}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

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
