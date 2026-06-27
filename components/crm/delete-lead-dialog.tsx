'use client';

import { useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { deleteLead } from '@/app/(dashboard)/crm/actions';
import type { CrmLead } from '@/types/crm';

type DeleteLeadDialogProps = {
  open: boolean;
  lead: CrmLead | null;
  onClose: () => void;
};

export function DeleteLeadDialog({ open, lead, onClose }: DeleteLeadDialogProps) {
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

  async function handleDelete(formData: FormData) {
    await deleteLead(formData);
    onClose();
    router.refresh();
  }

  if (!open || !lead) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-0 text-[var(--text-primary)] backdrop:bg-black/50"
      onClose={onClose}
    >
      <form action={handleDelete} className="space-y-5 p-6">
        <h2 id={titleId} className="text-lg font-semibold">
          Удалить лид?
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Лид <span className="font-medium text-[var(--text-primary)]">{lead.name}</span> будет
          удалён без возможности восстановления.
        </p>
        <input type="hidden" name="id" value={lead.id} />
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
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Удалить
          </button>
        </div>
      </form>
    </dialog>
  );
}
