'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';

import {
  importCrmLeadsAction,
  type CrmImportRow,
} from '@/app/(dashboard)/crm/actions';

type ParsedRow = CrmImportRow & {
  rawIndex: number;
};

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if ((char === ',' || char === ';' || char === '\t') && !quoted) {
      cells.push(cell.trim());
      cell = '';
      continue;
    }

    cell += char;
  }

  cells.push(cell.trim());
  return cells;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[\s_-]+/g, '');
}

function parseCsv(text: string): ParsedRow[] {
  const normalized = text.replace(/^\uFEFF/, '');
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const headerCells = parseCsvLine(lines[0]);
  const headers = headerCells.map(normalizeHeader);

  const aliases: Record<keyof CrmImportRow, string[]> = {
    name: ['name', 'имя', 'фио', 'клиент', 'название'],
    email: ['email', 'e-mail', 'почта'],
    phone: ['phone', 'телефон', 'мобильный', 'номер'],
    source: ['source', 'источник', 'канал'],
    notes: ['notes', 'note', 'комментарий', 'комментарии', 'заметка'],
  };

  const indexByField = Object.fromEntries(
    (Object.keys(aliases) as Array<keyof CrmImportRow>).map((field) => {
      const candidates = aliases[field].map(normalizeHeader);
      const index = headers.findIndex((header) => candidates.includes(header));
      return [field, index];
    }),
  ) as Record<keyof CrmImportRow, number>;

  const hasHeader = Object.values(indexByField).some((index) => index >= 0);

  return lines.slice(hasHeader ? 1 : 0).map((line, index) => {
    const cells = parseCsvLine(line);

    if (!hasHeader) {
      return {
        rawIndex: index + 1,
        name: cells[0] || '',
        phone: cells[1] || null,
        email: cells[2] || null,
        source: cells[3] || 'CSV import',
        notes: cells[4] || null,
      };
    }

    const read = (field: keyof CrmImportRow) => {
      const column = indexByField[field];
      return column >= 0 ? cells[column] || '' : '';
    };

    return {
      rawIndex: index + 2,
      name: read('name'),
      email: read('email') || null,
      phone: read('phone') || null,
      source: read('source') || 'CSV import',
      notes: read('notes') || null,
    };
  });
}

export function CrmImportStudio() {
  const [raw, setRaw] = useState('');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState('');
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => parseCsv(raw), [raw]);
  const validRows = rows.filter((row) => row.name.trim());

  const readFile = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setResult('');
    setRaw(await file.text());
  };

  const runImport = () => {
    if (!validRows.length || isPending) return;

    setResult('');

    startTransition(async () => {
      try {
        const response = await importCrmLeadsAction(
          validRows.map(({ rawIndex: _rawIndex, ...row }) => row),
        );
        setResult(response.message);
      } catch (error) {
        setResult(error instanceof Error ? error.message : 'Импорт не выполнен.');
      }
    });
  };

  return (
    <main className="relative mx-auto w-full max-w-[1280px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.10),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/crm" className="text-sm font-bold text-white/50 hover:text-white">
                ← CRM
              </Link>
              <span className="text-white/18">/</span>
              <p className="text-[12px] font-black uppercase tracking-[.16em] text-[#79eaf2]">
                ИМПОРТ ЛИДОВ
              </p>
            </div>

            <h1 className="mt-5 max-w-4xl text-[clamp(3rem,5vw,5.2rem)] font-black leading-[.92] tracking-[-.06em] text-[#fff8e7]">
              Загрузить базу
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                без ручного ввода.
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/68">
              CSV или вставка из таблицы. Дубли по email и телефону автоматически пропускаются.
            </p>
          </div>

          <a
            href="/crm/export"
            className="rounded-[16px] border border-white/[0.09] bg-white/[0.025] px-5 py-3 text-sm font-black text-white/66"
          >
            Скачать текущую CRM
          </a>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <div className="grid content-start gap-5">
          <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
              ФАЙЛ
            </p>

            <label className="mt-4 block cursor-pointer rounded-[22px] border border-dashed border-[#69e4ee]/16 bg-[#69e4ee]/[0.025] p-7 text-center">
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                className="sr-only"
                onChange={(event) => void readFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-base font-black text-[#fff8e7]">
                {fileName || 'Выберите CSV-файл'}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/46">
                Поддерживаются запятая, точка с запятой и табуляция.
              </p>
            </label>

            <div className="mt-5 rounded-[18px] border border-white/[0.07] bg-white/[0.018] p-4">
              <p className="text-[10px] font-black uppercase tracking-[.10em] text-white/34">
                РЕКОМЕНДУЕМЫЕ КОЛОНКИ
              </p>
              <p className="mt-2 text-sm leading-6 text-white/58">
                Имя · Телефон · Email · Источник · Комментарий
              </p>
            </div>

            <p className="mt-4 text-xs leading-5 text-white/34">
              Максимум 500 строк за один импорт. Пустые строки и записи без имени не добавляются.
            </p>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#f4d878]">
              ИЛИ ВСТАВИТЬ
            </p>
            <textarea
              rows={12}
              value={raw}
              onChange={(event) => {
                setRaw(event.target.value);
                setFileName('');
                setResult('');
              }}
              placeholder={'Имя,Телефон,Email,Источник,Комментарий\nАнна,+79991234567,anna@example.com,Выставка,Интерес к продукту'}
              className="mt-4 w-full resize-y rounded-[18px] border border-white/[0.08] bg-black/20 px-4 py-4 font-mono text-xs leading-6 text-white outline-none placeholder:text-white/24"
            />
          </div>
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
                ПРЕДПРОСМОТР
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                Найдено {validRows.length} лидов
              </h2>
            </div>
            <p className="text-xs text-white/34">
              строк всего: {rows.length}
            </p>
          </div>

          <div className="mt-5 max-h-[620px] overflow-auto rounded-[20px] border border-white/[0.07]">
            <div className="sticky top-0 grid grid-cols-[1.2fr_.9fr_1.1fr_.8fr] gap-3 border-b border-white/[0.07] bg-[#0a0f15] px-4 py-3 text-[10px] font-black uppercase tracking-[.10em] text-white/30">
              <span>Имя</span>
              <span>Телефон</span>
              <span>Email</span>
              <span>Источник</span>
            </div>

            {validRows.length ? (
              validRows.slice(0, 150).map((row) => (
                <div
                  key={row.rawIndex}
                  className="grid grid-cols-[1.2fr_.9fr_1.1fr_.8fr] gap-3 border-b border-white/[0.05] px-4 py-3 text-xs text-white/58 last:border-b-0"
                >
                  <span className="truncate font-black text-[#fff8e7]">{row.name}</span>
                  <span className="truncate">{row.phone || '—'}</span>
                  <span className="truncate">{row.email || '—'}</span>
                  <span className="truncate">{row.source || 'CSV import'}</span>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-sm leading-6 text-white/32">
                Загрузите файл или вставьте строки — здесь появится предпросмотр.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={runImport}
            disabled={!validRows.length || isPending}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isPending ? 'Импортирую…' : 'Добавить в CRM →'}
          </button>

          {result ? (
            <div className="mt-4 rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/66">
              {result}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
