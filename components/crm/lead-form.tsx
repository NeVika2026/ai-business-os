'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
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
  const [duplicateCandidates, setDuplicateCandidates] = useState<
    Array<{
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      reasons: Array<'email' | 'phone'>;
    }>
  >([]);
  const [submitError, setSubmitError] = useState('');

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
    setSubmitError('');

    try {
      const result = mode === 'create' ? await createLead(formData) : await updateLead(formData);

      if (result.status === 'duplicate') {
        setDuplicateCandidates(result.candidates);
        return;
      }

      setDuplicateCandidates([]);
      onClose();
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить карточку.');
    }
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
      <form
        action={handleSubmit}
        onChange={() => {
          if (duplicateCandidates.length) setDuplicateCandidates([]);
          if (submitError) setSubmitError('');
        }}
        className="space-y-5 p-6"
      >
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

        {duplicateCandidates.length ? (
          <div
            role="alert"
            className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4"
          >
            <p className="text-sm font-black text-amber-100">
              Похоже, такой клиент уже есть в CRM.
            </p>
            <p className="mt-1 text-xs leading-5 text-white/55">
              Я не создаю второй экземпляр молча. Проверьте найденную карточку или подтвердите, что нужна отдельная.
            </p>

            <div className="mt-3 grid gap-2">
              {duplicateCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{candidate.name}</p>
                    <p className="mt-1 text-[11px] text-white/45">
                      {candidate.reasons.includes('phone') ? 'совпадает телефон' : ''}
                      {candidate.reasons.length === 2 ? ' · ' : ''}
                      {candidate.reasons.includes('email') ? 'совпадает email' : ''}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-white/32">
                      {[candidate.phone, candidate.email].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Link
                    href={'/crm/' + encodeURIComponent(candidate.id)}
                    className="rounded-lg border border-white/[0.09] px-3 py-2 text-[10px] font-black text-white/65 hover:text-white"
                  >
                    Открыть →
                  </Link>
                </div>
              ))}
            </div>

            <button
              type="submit"
              name="allow_duplicate"
              value="1"
              className="mt-4 rounded-xl border border-amber-200/20 bg-amber-200/[0.08] px-4 py-2 text-xs font-black text-amber-100 hover:bg-amber-200/[0.12]"
            >
              {mode === 'create' ? 'Всё равно создать отдельную карточку' : 'Всё равно сохранить совпадение'}
            </button>
          </div>
        ) : null}

        {submitError ? (
          <p
            role="alert"
            className="rounded-xl border border-rose-300/20 bg-rose-300/[0.05] px-4 py-3 text-sm text-rose-100"
          >
            {submitError}
          </p>
        ) : null}

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
