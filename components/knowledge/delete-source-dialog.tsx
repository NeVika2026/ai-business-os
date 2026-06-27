'use client';

import { useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { deleteKnowledgeSource } from '@/app/(dashboard)/knowledge/actions';
import type { KnowledgeSource } from '@/types/knowledge';

type DeleteSourceDialogProps = {
  open: boolean;
  source: KnowledgeSource | null;
  onClose: () => void;
};

export function DeleteSourceDialog({ open, source, onClose }: DeleteSourceDialogProps) {
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
    await deleteKnowledgeSource(formData);
    onClose();
    router.refresh();
  }

  if (!open || !source) {
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
          Удалить источник?
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Источник <span className="font-medium text-[var(--text-primary)]">{source.title}</span> и
          связанные документы будут удалены.
        </p>
        <input type="hidden" name="id" value={source.id} />
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
