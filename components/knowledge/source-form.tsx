'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createKnowledgeSource, updateKnowledgeSource } from '@/app/(dashboard)/knowledge/actions';
import type { KnowledgeSource, KnowledgeSourceType } from '@/types/knowledge';
import {
  KNOWLEDGE_IMPORT_STATUSES,
  KNOWLEDGE_IMPORT_STATUS_LABELS,
  KNOWLEDGE_SOURCE_FORM_TYPES,
  KNOWLEDGE_SOURCE_TYPE_LABELS,
  mapFormTypeToDbType,
  sourceTypesWithFile,
  sourceTypesWithUrl,
} from '@/types/knowledge';

type SourceFormProps = {
  open: boolean;
  mode: 'create' | 'edit';
  source?: KnowledgeSource | null;
  onClose: () => void;
};

function getInitialFormType(source?: KnowledgeSource | null) {
  if (source?.metadata.format) {
    return String(source.metadata.format);
  }

  if (source?.type === 'manual' && source.metadata.mime_type === 'text/markdown') {
    return 'manual-md';
  }

  return source?.type ?? KNOWLEDGE_SOURCE_FORM_TYPES[0].value;
}

export function SourceForm({ open, mode, source, onClose }: SourceFormProps) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [formType, setFormType] = useState(() => getInitialFormType(source));
  const dbType = mapFormTypeToDbType(formType) as KnowledgeSourceType;

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
    formData.set('form_type', formType);

    const file = formData.get('file');

    if (file instanceof File && file.name) {
      formData.set('filename', file.name);
    }

    if (mode === 'create') {
      await createKnowledgeSource(formData);
    } else {
      await updateKnowledgeSource(formData);
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
            {mode === 'create' ? 'Новый источник' : 'Редактировать источник'}
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

        {mode === 'edit' && source ? (
          <>
            <input type="hidden" name="id" value={source.id} />
            {source.metadata.filename ? (
              <input type="hidden" name="existing_filename" value={source.metadata.filename} />
            ) : null}
          </>
        ) : null}

        <div className="grid gap-4">
          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Название *</span>
            <input
              name="title"
              required
              defaultValue={source?.title ?? ''}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Тип источника</span>
            <select
              name="type"
              value={formType}
              onChange={(event) => setFormType(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {KNOWLEDGE_SOURCE_FORM_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {sourceTypesWithUrl(dbType) ? (
            <label className="space-y-2">
              <span className="text-sm text-[var(--text-secondary)]">URL</span>
              <input
                name="source_uri"
                type="url"
                defaultValue={source?.source_uri ?? ''}
                placeholder="https://"
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              />
            </label>
          ) : null}

          {sourceTypesWithFile(dbType) ? (
            <label className="space-y-2">
              <span className="text-sm text-[var(--text-secondary)]">Файл</span>
              <input
                name="file"
                type="file"
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-1.5 file:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              />
              {source?.metadata.filename ? (
                <p className="text-xs text-[var(--text-secondary)]">
                  Текущий файл: {source.metadata.filename}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">
                  Файл пока не загружается — будет сохранено только имя файла.
                </p>
              )}
            </label>
          ) : null}

          {mode === 'edit' && source ? (
            <label className="space-y-2">
              <span className="text-sm text-[var(--text-secondary)]">Статус</span>
              <select
                name="status"
                defaultValue={source.status}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                {KNOWLEDGE_IMPORT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {KNOWLEDGE_IMPORT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {mode === 'edit' && source ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Тип в базе: {KNOWLEDGE_SOURCE_TYPE_LABELS[source.type]}
            </p>
          ) : null}
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
