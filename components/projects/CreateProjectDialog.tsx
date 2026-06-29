'use client';

import { useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { createProject } from '@/app/(dashboard)/projects/actions';
import { PROJECT_TYPE_LABELS, PROJECT_TYPES } from '@/utils/projects/project-types';

type CreateProjectDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
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
    await createProject(formData);
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
            New project
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

        <label className="block space-y-2">
          <span className="text-sm text-[var(--text-secondary)]">Name *</span>
          <input
            name="name"
            required
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm"
            placeholder="Marketing launch"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-[var(--text-secondary)]">Description</span>
          <textarea
            name="description"
            rows={4}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm"
            placeholder="- Launch campaign&#10;- Connect CRM pipeline"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Type</span>
            <select
              name="project_type"
              defaultValue="general"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm"
            >
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROJECT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Icon</span>
            <input
              name="icon"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm"
              placeholder="📁"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm text-[var(--text-secondary)]">Color</span>
          <input
            name="color"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm"
            placeholder="#6366f1"
          />
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Create project
          </button>
        </div>
      </form>
    </dialog>
  );
}
