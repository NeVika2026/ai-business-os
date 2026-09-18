'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { OsaFirstExperienceLayout } from '@/components/first-experience/OsaFirstExperienceLayout';
import {
  buildDevSourceLabel,
  buildLoginFirstResultView,
  type LoginFirstResultInput,
} from '@/lib/login/first-result-view';

type FirstResultScreenProps = {
  entry: LoginFirstResultInput | null;
  resultId?: string | null;
};

function cleanLine(value: string): string {
  return value
    .replace(/^#{1,6}\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/\`/g, '')
    .trim();
}

function isHeading(line: string): boolean {
  const cleaned = cleanLine(line).replace(/:$/, '');
  if (!cleaned || cleaned.length > 64) return false;

  const known = [
    'первый экран',
    'подзаголовок',
    'cta',
    'hero',
    'проблема',
    'решение',
    'как это работает',
    'что мы делаем',
    'услуги',
    'преимущества',
    'почему нам доверяют',
    'доверие',
    'тарифы',
    'faq',
    'частые вопросы',
    'возражения',
    'форма заявки',
    'финальный cta',
    'финальный призыв',
    'следующий шаг',
  ];

  const normalized = cleaned.toLowerCase().replace(/ё/g, 'е');
  if (known.some((item) => normalized.includes(item))) return true;

  return cleaned === cleaned.toUpperCase() && /[А-ЯA-Z]/.test(cleaned);
}

function isFormPlaceholder(line: string): boolean {
  const normalized = cleanLine(line).toLowerCase().replace(/ё/g, 'е');
  return normalized.includes('форма заявки') && (line.includes('[') || normalized.includes('имя') || normalized.includes('телефон'));
}


type ArtifactBlock = {
  heading: string | null;
  body: string[];
  listLike: boolean;
};

function parseArtifactBlocks(content: string): ArtifactBlock[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split('\n')
        .filter((line) => !isFormPlaceholder(line))
        .map(cleanLine)
        .filter(Boolean);

      if (!lines.length) return null;

      const heading = isHeading(lines[0]!) ? lines[0]!.replace(/:$/, '') : null;
      const body = heading ? lines.slice(1) : lines;
      const listLike =
        body.length > 0 &&
        body.every((line) => /^(?:[-•]|\d+[.)])\s*/.test(line));

      return { heading, body, listLike };
    })
    .filter((block): block is ArtifactBlock => Boolean(block));
}

function blockMatches(block: ArtifactBlock, tokens: string[]): boolean {
  const heading = (block.heading ?? '').toLowerCase().replace(/ё/g, 'е');
  return tokens.some((token) => heading.includes(token));
}

function renderLandingPreview(content: string) {
  const blocks = parseArtifactBlocks(content);
  const hero = blocks.find((block) => blockMatches(block, ['первый экран', 'hero']));
  const subtitle = blocks.find((block) => blockMatches(block, ['подзаголов']));
  const cta = blocks.find((block) => blockMatches(block, ['cta', 'призыв']));
  const excluded = new Set([hero, subtitle, cta].filter(Boolean));
  const rest = blocks.filter((block) => !excluded.has(block));

  const heroTitle = hero?.body[0] ?? 'Управление недвижимостью без расстояния';
  const heroSubtitle =
    subtitle?.body.join(' ') ??
    hero?.body.slice(1).join(' ') ??
    'Контроль объекта, арендаторов и расходов — в одном сервисе.';
  const ctaText = cta?.body[0] ?? 'Оставить заявку';

  return (
    <article className="overflow-hidden rounded-[32px] border border-white/[0.10] bg-[#080d13] shadow-[0_30px_90px_-40px_rgba(0,0,0,.9)]">
      <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.025] px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6f61]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f1c96c]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#69e4ee]/80" />
        <div className="ml-3 rounded-full border border-white/[0.06] bg-black/20 px-4 py-1.5 text-[11px] text-white/45">
          предпросмотр готового лендинга
        </div>
      </div>

      <section className="relative overflow-hidden px-6 py-12 sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute right-[-8%] top-[-22%] h-[360px] w-[360px] rounded-full bg-[#69e4ee]/10 blur-[90px]" />
        <div className="pointer-events-none absolute bottom-[-30%] left-[20%] h-[320px] w-[320px] rounded-full bg-[#f1c96c]/10 blur-[100px]" />
        <p className="relative text-[11px] font-black uppercase tracking-[.2em] text-[#69e4ee]">
          УПРАВЛЕНИЕ НЕДВИЖИМОСТЬЮ
        </p>
        <h2 className="relative mt-4 max-w-[14ch] text-4xl font-black leading-[.96] tracking-[-.055em] text-[#fff8e7] sm:text-6xl">
          {heroTitle}
        </h2>
        <p className="relative mt-5 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
          {heroSubtitle}
        </p>
        <button
          type="button"
          className="relative mt-7 inline-flex min-h-12 items-center rounded-2xl bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-6 text-sm font-black text-[#1b1105]"
        >
          {ctaText}
        </button>
      </section>

      <div className="grid gap-px bg-white/[0.06] md:grid-cols-2">
        {rest.map((block, index) => (
          <section
            key={`landing-${index}`}
            className="min-h-[190px] bg-[#090f16] p-6 sm:p-8"
          >
            {block.heading ? (
              <h3 className="text-xl font-black tracking-[-.025em] text-[#fff1bf]">
                {block.heading}
              </h3>
            ) : null}

            {block.listLike ? (
              <ul className="mt-4 grid gap-3">
                {block.body.map((line, lineIndex) => (
                  <li
                    key={lineIndex}
                    className="flex gap-3 text-sm leading-6 text-white/74 sm:text-base"
                  >
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#69e4ee]" />
                    <span>{line.replace(/^(?:[-•]|\d+[.)])\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={block.heading ? 'mt-4 grid gap-3' : 'grid gap-3'}>
                {block.body.map((line, lineIndex) => (
                  <p key={lineIndex} className="text-sm leading-6 text-white/74 sm:text-base sm:leading-7">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

function renderArtifact(content: string) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, blockIndex) => {
    const lines = block
      .split('\n')
      .filter((line) => !isFormPlaceholder(line))
      .map(cleanLine)
      .filter(Boolean);

    if (!lines.length) return null;

    if (lines.length === 1 && isHeading(lines[0]!)) {
      return (
        <h2
          key={`heading-${blockIndex}`}
          className="mt-8 text-xl font-black tracking-[-0.025em] text-[#fff4cf] sm:text-2xl"
        >
          {lines[0]!.replace(/:$/, '')}
        </h2>
      );
    }

    const heading = isHeading(lines[0]!) ? lines[0]!.replace(/:$/, '') : null;
    const body = heading ? lines.slice(1) : lines;
    const listLike =
      body.length > 0 &&
      body.every((line) => /^(?:[-•]|\d+[.)])\s*/.test(line));

    return (
      <section
        key={`block-${blockIndex}`}
        className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6"
      >
        {heading ? (
          <h2 className="text-lg font-black tracking-[-0.02em] text-[#fff1bf] sm:text-xl">
            {heading}
          </h2>
        ) : null}

        {listLike ? (
          <ul className={`${heading ? 'mt-4 ' : ''}grid gap-3`}>
            {body.map((line, lineIndex) => (
              <li
                key={`${blockIndex}-${lineIndex}`}
                className="flex gap-3 text-[15px] leading-7 text-white/82 sm:text-base"
              >
                <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#69e4ee]" />
                <span>{line.replace(/^(?:[-•]|\d+[.)])\s*/, '')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={`${heading ? 'mt-4 ' : ''}grid gap-3`}>
            {body.map((line, lineIndex) => (
              <p
                key={`${blockIndex}-${lineIndex}`}
                className="text-[15px] leading-7 text-white/82 sm:text-base sm:leading-7"
              >
                {line}
              </p>
            ))}
          </div>
        )}
      </section>
    );
  });
}

export function FirstResultScreen({
  entry,
  resultId = null,
}: FirstResultScreenProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const [resolvedEntry, setResolvedEntry] = useState<LoginFirstResultInput | null>(entry);
  const [clientRecoveryChecked, setClientRecoveryChecked] = useState(Boolean(entry) || !resultId);

  useEffect(() => {
    if (entry) {
      setResolvedEntry(entry);
      setClientRecoveryChecked(true);
      return;
    }

    if (!resultId) {
      setClientRecoveryChecked(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(`business-zavod:first-result:${resultId}`);

      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LoginFirstResultInput>;

        if (
          typeof parsed.content === 'string' &&
          typeof parsed.task === 'string' &&
          parsed.content.trim()
        ) {
          setResolvedEntry({
            task: parsed.task,
            content: parsed.content,
            usedFallback:
              typeof parsed.usedFallback === 'boolean' ? parsed.usedFallback : undefined,
            failureReason:
              typeof parsed.failureReason === 'string' || parsed.failureReason === null
                ? parsed.failureReason
                : undefined,
          });
        }
      }
    } catch {
      // Corrupt or unavailable browser storage falls through to the normal error state.
    } finally {
      setClientRecoveryChecked(true);
    }
  }, [entry, resultId]);

  if (!clientRecoveryChecked) {
    return (
      <OsaFirstExperienceLayout hero className="osa-fe-canvas--factory-result">
        <main className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-5 py-12 sm:px-8">
          <div className="w-full rounded-[30px] border border-white/10 bg-white/[0.035] p-7 text-white backdrop-blur-xl sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[.16em] text-[#69e4ee]">OSA</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">
              Загружаю готовый результат…
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
              Восстанавливаю результат из локального хранилища браузера.
            </p>
          </div>
        </main>
      </OsaFirstExperienceLayout>
    );
  }

  const safeContent = resolvedEntry?.content?.trim() ?? '';

  if (!safeContent) {
    return (
      <OsaFirstExperienceLayout hero className="osa-fe-canvas--factory-result">
        <main className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-5 py-12 sm:px-8">
          <div className="w-full rounded-[30px] border border-white/10 bg-white/[0.035] p-7 text-white backdrop-blur-xl sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[.16em] text-[#69e4ee]">OSA</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">
              Не получилось собрать результат
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
              Попробуйте сформулировать задачу чуть иначе.
            </p>
            <Link
              href="/login/intro"
              className="mt-7 inline-flex rounded-2xl bg-[linear-gradient(135deg,#ffe08a,#d5962d)] px-5 py-3 font-black text-[#1b1105]"
            >
              Изменить задачу
            </Link>
          </div>
        </main>
      </OsaFirstExperienceLayout>
    );
  }

  const view = buildLoginFirstResultView({
    task: resolvedEntry?.task ?? '',
    content: safeContent,
    usedFallback: resolvedEntry?.usedFallback,
    failureReason: resolvedEntry?.failureReason,
  });

  const task = resolvedEntry?.task?.trim() ?? '';
  const shortTask =
    task.length > 180 ? `${task.slice(0, 177).trim()}…` : task;
  const normalizedTask = task.toLowerCase().replace(/ё/g, 'е');
  const isLandingTask = ['лендинг', 'сайт', 'страниц'].some((token) =>
    normalizedTask.includes(token),
  );

  return (
    <OsaFirstExperienceLayout hero artActive className="osa-fe-canvas--factory-result">
      <main className="relative mx-auto min-h-dvh w-full max-w-6xl px-5 py-10 text-white sm:px-8 sm:py-14">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#69e4ee]/10 blur-[120px]"
          aria-hidden="true"
        />

        <header className="relative border-b border-white/[0.08] pb-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[.2em] text-[#69e4ee]">
                BUSINESS ZAVOD · ГОТОВЫЙ РЕЗУЛЬТАТ
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-.045em] text-[#fff8e7] sm:text-5xl">
                OSA собрала первый рабочий вариант
              </h1>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-emerald-200">
              READY
            </span>
          </div>

          {shortTask ? (
            <p className="mt-5 max-w-4xl text-base leading-7 text-white/68">
              {shortTask}
            </p>
          ) : null}

          {isDev ? (
            <p className="mt-3 text-xs text-white/35">
              {buildDevSourceLabel(view.source)}
              {resolvedEntry?.failureReason ? ` · ${entry.failureReason}` : ''}
            </p>
          ) : null}
        </header>

        <div className="relative mt-8 grid gap-5">
          {isLandingTask ? renderLandingPreview(safeContent) : renderArtifact(safeContent)}

          {isLandingTask ? (
            <section className="rounded-[26px] border border-[#f1c96c]/18 bg-[linear-gradient(145deg,rgba(241,201,108,.055),rgba(105,228,238,.025))] p-5 sm:p-7">
              <p className="text-[12px] font-black uppercase tracking-[.16em] text-[#69e4ee]">
                ФОРМА ЗАЯВКИ
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[#fff4cf]">
                Оставьте контакты — обсудим управление объектом
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
                Без выдуманных обещаний и сроков: менеджер свяжется с вами после получения заявки.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  ['Имя', 'Как к вам обращаться'],
                  ['Телефон', '+7 900 000-00-00'],
                  ['Email', 'name@example.com'],
                  ['Комментарий', 'Коротко опишите объект и задачу'],
                ].map(([label, placeholder]) => (
                  <label key={label} className={label === 'Комментарий' ? 'md:col-span-2' : ''}>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-white/62">
                      {label}
                    </span>
                    <input
                      type={label === 'Email' ? 'email' : label === 'Телефон' ? 'tel' : 'text'}
                      placeholder={placeholder}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/38"
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-6 text-sm font-black text-[#1b1105]"
              >
                Оставить заявку
              </button>
            </section>
          ) : null}
        </div>

        <footer className="relative mt-10 flex flex-wrap items-center gap-3 border-t border-white/[0.08] pt-7">
          <Link
            href="/login/sign-in"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-6 text-sm font-black text-[#1b1105] shadow-[0_16px_34px_-18px_rgba(231,185,82,.7)]"
          >
            Продолжить в Бизнес-Заводе
          </Link>
          <Link
            href="/login/intro"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-6 text-sm font-bold text-white/78"
          >
            Изменить задачу
          </Link>
        </footer>
      </main>
    </OsaFirstExperienceLayout>
  );
}
