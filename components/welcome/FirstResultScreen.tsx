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

type LandingMediaSet = {
  eyebrow: string;
  heroPoster?: string;
  gallery: string[];
  stats: Array<{ value: string; label: string }>;
};

function isPropertyManagementTask(task: string): boolean {
  const normalized = task.toLowerCase().replace(/ё/g, 'е');
  const hasProperty = ['недвиж', 'квартир', 'аренд', 'риелт', 'объект'].some((token) =>
    normalized.includes(token),
  );
  const hasManagementIntent =
    normalized.includes('управлен') ||
    normalized.includes('управля') ||
    normalized.includes('сдать квартир') ||
    normalized.includes('сдавать квартир') ||
    normalized.includes('арендатор') ||
    normalized.includes('контроль объект');

  return hasProperty && hasManagementIntent;
}

function getLandingMedia(task: string): LandingMediaSet {
  if (isPropertyManagementTask(task)) {
    return {
      eyebrow: 'УПРАВЛЕНИЕ НЕДВИЖИМОСТЬЮ',
      heroPoster: '/assets/landing/real-estate-hero.svg',
      gallery: [
        '/assets/landing/real-estate-detail-1.svg',
        '/assets/landing/real-estate-detail-2.svg',
      ],
      stats: [
        { value: '24/7', label: 'видимость состояния объекта' },
        { value: '1 окно', label: 'для аренды, ремонта и расходов' },
        { value: '0 хаоса', label: 'в чатах, переводах и подрядчиках' },
      ],
    };
  }

  return {
    eyebrow: 'ГОТОВЫЙ ПРЕМИАЛЬНЫЙ ЛЕНДИНГ',
    gallery: [],
    stats: [
      { value: '01', label: 'сильный первый экран' },
      { value: '02', label: 'понятная логика страницы' },
      { value: '03', label: 'визуальный CTA' },
    ],
  };
}

function renderLandingPreview(content: string, task: string) {
  const blocks = parseArtifactBlocks(content);
  const hero = blocks.find((block) => blockMatches(block, ['первый экран', 'hero']));
  const subtitle = blocks.find((block) => blockMatches(block, ['подзаголов']));
  const cta = blocks.find((block) => blockMatches(block, ['cta', 'призыв']));
  const media = getLandingMedia(task);

  const formBlock = blocks.find((block) => blockMatches(block, ['форма заявк']));
  const excluded = new Set(
    [hero, subtitle, cta, formBlock].filter(Boolean),
  );
  const rest = blocks.filter((block) => !excluded.has(block));

  const heroTitle = hero?.body[0] ?? 'Решение под вашу задачу';
  const heroSubtitle =
    subtitle?.body.join(' ') ??
    hero?.body.slice(1).join(' ') ??
    'Понятное предложение, ключевые преимущества и следующий шаг.';
  const ctaText = cta?.body[0] ?? 'Оставить заявку';

  const problemBlock = rest.find((block) => blockMatches(block, ['проблем']));
  const solutionBlock = rest.find((block) => blockMatches(block, ['решен']));
  const servicesBlock = rest.find((block) =>
    blockMatches(block, ['услуг', 'преимущ', 'что мы делаем']),
  );
  const trustBlock = rest.find((block) =>
    blockMatches(block, ['довер', 'почему нам доверяют']),
  );
  const tariffBlock = rest.find((block) => blockMatches(block, ['тариф']));
  const faqBlock = rest.find((block) =>
    blockMatches(block, ['faq', 'частые вопрос', 'возраж']),
  );

  const knownBlocks = new Set(
    [problemBlock, solutionBlock, servicesBlock, trustBlock, tariffBlock, faqBlock].filter(Boolean),
  );
  const otherBlocks = rest.filter((block) => !knownBlocks.has(block));

  const backgroundStyle = media.heroPoster
    ? { backgroundImage: `linear-gradient(180deg,rgba(5,8,13,.08),rgba(5,8,13,.75)),url("${media.heroPoster}")` }
    : undefined;

  return (
    <article className="overflow-hidden rounded-[34px] border border-white/[0.10] bg-[#070b11] shadow-[0_36px_120px_-54px_rgba(0,0,0,.96)]">
      <div className="flex items-center gap-2 border-b border-white/[0.08] bg-black/30 px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6f61]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f1c96c]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#69e4ee]/80" />
        <div className="ml-3 rounded-full border border-white/[0.06] bg-white/[0.025] px-4 py-1.5 text-[11px] font-bold text-white/50">
          PREMIUM WEBSITE PREVIEW
        </div>
        <span className="ml-auto hidden rounded-full border border-emerald-300/12 bg-emerald-300/[0.04] px-3 py-1 text-[10px] font-black text-emerald-200/82 sm:inline-flex">
          VISUAL + MOTION
        </span>
      </div>

      <section className="relative min-h-[660px] overflow-hidden">
        {media.heroPoster ? (
          <>
            <img
              src={media.heroPoster}
              alt="Премиальный интерьер"
              className="absolute inset-0 h-full w-full object-cover opacity-78"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,13,.97)_0%,rgba(5,8,13,.88)_42%,rgba(5,8,13,.30)_72%,rgba(5,8,13,.52)_100%)]" />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={backgroundStyle}
          />
        )}

        <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-[#69e4ee]/12 blur-[90px]" />
        <div className="pointer-events-none absolute bottom-[-6%] right-[20%] h-64 w-64 rounded-full bg-[#f1c96c]/12 blur-[110px]" />

        <div className="relative z-[2] flex min-h-[660px] flex-col justify-between px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[11px] font-black uppercase tracking-[.22em] text-[#7ef1f8]">
                {media.eyebrow}
              </p>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.10em] text-white/68 backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300" />
                visual motion
              </span>
            </div>

            <h2 className="mt-6 max-w-[12ch] text-[clamp(3.2rem,7vw,7rem)] font-black leading-[.88] tracking-[-.07em] text-[#fff8e7] drop-shadow-[0_14px_34px_rgba(0,0,0,.38)]">
              {heroTitle}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/78 sm:text-xl sm:leading-8">
              {heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex min-h-14 items-center rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-7 text-sm font-black text-[#1b1105] shadow-[0_18px_46px_-22px_rgba(241,201,108,.8)]"
              >
                {ctaText}
              </button>
              <button
                type="button"
                className="inline-flex min-h-14 items-center gap-2 rounded-[18px] border border-white/[0.14] bg-black/25 px-6 text-sm font-bold text-white/82 backdrop-blur-md"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] text-[11px]">
                  ▶
                </span>
                Смотреть, как это работает
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-2 sm:grid-cols-3">
            {media.stats.map((item) => (
              <div
                key={item.label}
                className="rounded-[18px] border border-white/[0.10] bg-black/30 p-4 backdrop-blur-xl"
              >
                <p className="text-2xl font-black tracking-[-.04em] text-[#fff0ad]">
                  {item.value}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/58">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {media.gallery.length ? (
        <section className="grid gap-px bg-white/[0.06] lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative min-h-[420px] overflow-hidden bg-[#0a0f15]">
            <img
              src={media.gallery[0]}
              alt="Премиальный интерьер объекта"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(5,8,13,.82)_100%)]" />
            <div className="relative z-[2] flex min-h-[420px] items-end p-7 sm:p-9">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#7ef1f8]">
                  ОБЪЕКТ ПОД КОНТРОЛЕМ
                </p>
                <h3 className="mt-2 max-w-lg text-3xl font-black tracking-[-.04em] text-[#fff8e7]">
                  Видно не только цифры. Видно, что происходит с квартирой.
                </h3>
              </div>
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden bg-[#0a0f15]">
            <img
              src={media.gallery[1]}
              alt="Цифровой контроль объекта"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgba(5,8,13,.86)_100%)]" />
            <div className="relative z-[2] flex min-h-[420px] items-end p-7 sm:p-9">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#f1c96c]">
                  СПОКОЙСТВИЕ СОБСТВЕННИКА
                </p>
                <p className="mt-2 max-w-md text-lg leading-7 text-white/78">
                  Арендаторы, коммунальные платежи, ремонт и состояние объекта — в одной логике управления.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {(problemBlock || solutionBlock) ? (
        <section className="grid gap-px bg-white/[0.06] md:grid-cols-2">
          {[problemBlock, solutionBlock].filter(Boolean).map((block, index) => (
            <div
              key={block?.heading ?? index}
              className={[
                'min-h-[280px] p-7 sm:p-9',
                index === 0
                  ? 'bg-[linear-gradient(145deg,#0a0f16,#080b10)]'
                  : 'bg-[linear-gradient(145deg,#0b1115,#10130f)]',
              ].join(' ')}
            >
              <span className="text-[11px] font-black uppercase tracking-[.14em] text-white/36">
                {index === 0 ? '01 · БОЛЬ' : '02 · РЕШЕНИЕ'}
              </span>
              {block?.heading ? (
                <h3 className="mt-3 text-2xl font-black tracking-[-.035em] text-[#fff1bf]">
                  {block.heading}
                </h3>
              ) : null}
              <div className="mt-4 grid gap-3">
                {block?.body.map((line, lineIndex) => (
                  <p key={lineIndex} className="text-base leading-7 text-white/70">
                    {line.replace(/^(?:[-•]|d+[.)])s*/, '')}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {servicesBlock ? (
        <section className="bg-[#070b11] px-6 py-12 sm:px-9 sm:py-14">
          <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#69e4ee]">
            СЕРВИС
          </p>
          <h3 className="mt-3 max-w-3xl text-3xl font-black tracking-[-.045em] text-[#fff8e7] sm:text-4xl">
            {servicesBlock.heading ?? 'Всё, что нужно собственнику'}
          </h3>
          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {servicesBlock.body.map((line, lineIndex) => (
              <div
                key={lineIndex}
                className="group rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5 transition hover:-translate-y-1 hover:border-[#69e4ee]/22 hover:bg-[#69e4ee]/[0.035]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.04] text-sm font-black text-[#79eaf2]">
                  {String(lineIndex + 1).padStart(2, '0')}
                </div>
                <p className="mt-4 text-base font-bold leading-7 text-white/82">
                  {line.replace(/^(?:[-•]|d+[.)])s*/, '')}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {(trustBlock || tariffBlock) ? (
        <section className="grid gap-px bg-white/[0.06] lg:grid-cols-2">
          {trustBlock ? (
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(105,228,238,.07),transparent_42%),#090e14] p-7 sm:p-9">
              <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#79eaf2]">
                ДОВЕРИЕ
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                {trustBlock.heading ?? 'Прозрачность вместо обещаний'}
              </h3>
              <div className="mt-4 grid gap-3">
                {trustBlock.body.map((line, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-3.5"
                  >
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/[0.08] text-[10px] text-emerald-200">
                      ✓
                    </span>
                    <p className="text-sm leading-6 text-white/70">{line}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tariffBlock ? (
            <div className="bg-[radial-gradient(circle_at_top_right,rgba(241,201,108,.08),transparent_45%),#0b0e12] p-7 sm:p-9">
              <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#f1c96c]">
                УСЛОВИЯ
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                {tariffBlock.heading ?? 'Стоимость без выдуманных цифр'}
              </h3>
              <div className="mt-5 rounded-[22px] border border-[#f1c96c]/14 bg-[#f1c96c]/[0.035] p-5">
                {tariffBlock.body.map((line, index) => (
                  <p key={index} className="text-base leading-7 text-white/72">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {faqBlock ? (
        <section className="bg-[#070b11] px-6 py-12 sm:px-9">
          <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#69e4ee]">
            FAQ
          </p>
          <h3 className="mt-3 text-3xl font-black tracking-[-.04em] text-[#fff8e7]">
            {faqBlock.heading ?? 'Частые вопросы'}
          </h3>
          <div className="mt-6 grid gap-3">
            {faqBlock.body.map((line, index) => (
              <div
                key={index}
                className="rounded-[18px] border border-white/[0.07] bg-white/[0.02] px-5 py-4 text-base leading-7 text-white/72"
              >
                {line.replace(/^(?:[-•]|d+[.)])s*/, '')}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {otherBlocks.length ? (
        <section className="grid gap-px bg-white/[0.06] md:grid-cols-2">
          {otherBlocks.map((block, index) => (
            <div key={index} className="min-h-[220px] bg-[#090f16] p-7 sm:p-8">
              {block.heading ? (
                <h3 className="text-xl font-black tracking-[-.025em] text-[#fff1bf]">
                  {block.heading}
                </h3>
              ) : null}
              <div className="mt-4 grid gap-3">
                {block.body.map((line, lineIndex) => (
                  <p key={lineIndex} className="text-sm leading-6 text-white/70 sm:text-base">
                    {line.replace(/^(?:[-•]|d+[.)])s*/, '')}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}
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
    if (entry || !resultId) return;

    const frame = window.requestAnimationFrame(() => {
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
    });

    return () => window.cancelAnimationFrame(frame);
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
  const continueNext = task ? `/home?prompt=${encodeURIComponent(task)}` : '/home';
  const continueHref = `/login/sign-in?next=${encodeURIComponent(continueNext)}`;
  const normalizedTask = task.toLowerCase().replace(/ё/g, 'е');
  const isLandingTask = ['лендинг', 'сайт', 'страниц'].some((token) =>
    normalizedTask.includes(token),
  );
  const propertyManagementTask = isPropertyManagementTask(task);
  const formTitle = propertyManagementTask
    ? 'Оставьте контакты — обсудим управление объектом'
    : 'Оставьте контакты — обсудим задачу';
  const formDescription = propertyManagementTask
    ? 'Без выдуманных обещаний и сроков: менеджер свяжется с вами после получения заявки.'
    : 'Без выдуманных обещаний и сроков: уточним детали после заявки.';
  const commentPlaceholder = propertyManagementTask
    ? 'Коротко опишите объект и задачу'
    : 'Коротко опишите задачу';

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
              {resolvedEntry?.failureReason ? ` · ${resolvedEntry.failureReason}` : ''}
            </p>
          ) : null}
        </header>

        <div className="relative mt-8 grid gap-5">
          {isLandingTask ? renderLandingPreview(safeContent, task) : renderArtifact(safeContent)}

          {isLandingTask ? (
            <section className="rounded-[26px] border border-[#f1c96c]/18 bg-[linear-gradient(145deg,rgba(241,201,108,.055),rgba(105,228,238,.025))] p-5 sm:p-7">
              <p className="text-[12px] font-black uppercase tracking-[.16em] text-[#69e4ee]">
                ФОРМА ЗАЯВКИ
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[#fff4cf]">
                {formTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
                {formDescription}
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  ['Имя', 'Как к вам обращаться'],
                  ['Телефон', '+7 900 000-00-00'],
                  ['Email', 'name@example.com'],
                  ['Комментарий', commentPlaceholder],
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
            href={continueHref}
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
