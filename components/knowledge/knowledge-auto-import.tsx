'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  failKnowledgeUpload,
  prepareKnowledgeUpload,
  processKnowledgeUpload,
} from '@/app/(dashboard)/knowledge/actions';
import { createClient } from '@/services/supabase/client';

type ImportState =
  | 'checking'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'duplicate'
  | 'failed';

type ImportRow = {
  key: string;
  filename: string;
  sizeBytes: number;
  state: ImportState;
  message: string;
  sourceId?: string;
};

type KnowledgeAutoImportProps = {
  projectId?: string | null;
};

const MAX_FILE_BYTES = 100 * 1024 * 1024;

function formatBytes(value: number) {
  if (value < 1024) return String(value) + ' B';
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' КБ';
  return (value / (1024 * 1024)).toFixed(1) + ' МБ';
}

async function sha256(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

function initialRow(file: File): ImportRow {
  return {
    key: [file.name, file.size, file.lastModified].join(':'),
    filename: file.name,
    sizeBytes: file.size,
    state: 'checking',
    message: 'Проверяю файл и дубли…',
  };
}

export function KnowledgeAutoImport({ projectId }: KnowledgeAutoImportProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [busy, setBusy] = useState(false);

  function patchRow(key: string, patch: Partial<ImportRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  async function importOne(file: File) {
    const row = initialRow(file);
    const key = row.key;
    setRows((current) => [row, ...current.filter((item) => item.key !== key)]);

    if (file.size > MAX_FILE_BYTES) {
      patchRow(key, {
        state: 'failed',
        message: 'Файл больше 100 МБ. Разделите его на несколько частей.',
      });
      return;
    }

    try {
      const contentHash = await sha256(file);
      const prepared = await prepareKnowledgeUpload({
        filename: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
        contentHash,
        projectId: projectId ?? null,
      });

      if (prepared.status === 'duplicate') {
        patchRow(key, {
          state: 'duplicate',
          sourceId: prepared.sourceId,
          message:
            'Уже есть в базе: «' +
            prepared.title +
            '» (' +
            prepared.importStatus +
            '). Повтор не создан.',
        });
        return;
      }

      patchRow(key, {
        state: 'uploading',
        sourceId: prepared.sourceId,
        message: 'Загружаю в приватное хранилище…',
      });

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('knowledge-files')
        .upload(prepared.storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        await failKnowledgeUpload(prepared.sourceId, uploadError.message);
        patchRow(key, {
          state: 'failed',
          message: 'Ошибка загрузки: ' + uploadError.message,
        });
        return;
      }

      patchRow(key, {
        state: 'processing',
        message: 'Извлекаю текст, режу на смысловые чанки и индексирую…',
      });

      const processed = await processKnowledgeUpload(prepared.sourceId);
      if (processed.status === 'failed') {
        patchRow(key, {
          state: 'failed',
          message: processed.message,
        });
        return;
      }

      patchRow(key, {
        state: 'completed',
        message:
          'Готово: ' +
          processed.documentCount +
          ' документов, ' +
          processed.chunkCount +
          ' чанков.',
      });
      router.refresh();
    } catch (error) {
      patchRow(key, {
        state: 'failed',
        message: error instanceof Error ? error.message : 'Не удалось импортировать файл.',
      });
    }
  }

  async function importFiles(files: File[]) {
    if (files.length === 0 || busy) {
      return;
    }

    setBusy(true);
    try {
      for (const file of files) {
        await importOne(file);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Автоимпорт знаний
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            Кидайте файлы. Бизнес-завод разберёт их сам.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            PDF, DOCX, Telegram HTML/JSON, ZIP, TXT и Markdown. Система проверит дубли,
            извлечёт текст, создаст документы и чанки и подключит их к OSA.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white focus-within:ring-2 focus-within:ring-[var(--accent)]">
              {busy ? 'Обрабатываю…' : 'Выбрать файлы'}
              <input
                ref={inputRef}
                type="file"
                multiple
                disabled={busy}
                accept=".pdf,.docx,.zip,.txt,.md,.markdown,.html,.htm,.json"
                className="sr-only"
                onChange={(event) => importFiles(Array.from(event.target.files ?? []))}
              />
            </label>
            <span className="text-xs text-[var(--text-secondary)]">
              до 100 МБ на файл · можно выбрать несколько сразу
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Что происходит автоматически</p>
          <ol className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            <li>1. SHA-256 и проверка дубля</li>
            <li>2. Приватная загрузка файла</li>
            <li>3. Извлечение текста</li>
            <li>4. Разделение на смысловые чанки</li>
            <li>5. Подключение к поиску OSA</li>
          </ol>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="border-t border-[var(--border-subtle)]">
          <ul className="divide-y divide-[var(--border-subtle)]">
            {rows.map((row) => (
              <li key={row.key} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {row.filename}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {formatBytes(row.sizeBytes)} · {row.message}
                  </p>
                </div>
                <ImportBadge state={row.state} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function ImportBadge({ state }: { state: ImportState }) {
  const labels: Record<ImportState, string> = {
    checking: 'Проверка',
    uploading: 'Загрузка',
    processing: 'Индексация',
    completed: 'Готово',
    duplicate: 'Дубль',
    failed: 'Ошибка',
  };

  return (
    <span
      className={
        'shrink-0 rounded-full border px-3 py-1 text-xs font-medium ' +
        (state === 'completed'
          ? 'border-emerald-500/30 text-emerald-300'
          : state === 'failed'
            ? 'border-red-500/30 text-red-300'
            : state === 'duplicate'
              ? 'border-amber-500/30 text-amber-300'
              : 'border-[var(--border-subtle)] text-[var(--text-secondary)]')
      }
    >
      {labels[state]}
    </span>
  );
}
