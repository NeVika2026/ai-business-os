'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  MARKETING_CHANNELS,
  buildMarketingPackPrompt,
} from '@/utils/platform/marketing-pack';

export function MarketingPackBuilder() {
  const router = useRouter();
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [channels, setChannels] = useState<string[]>(['VK', 'Telegram']);

  const toggleChannel = (channel: string) => {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    );
  };

  const canContinue = product.trim().length > 0 && audience.trim().length > 0;

  const openInOsa = () => {
    if (!canContinue) return;

    const prompt = buildMarketingPackPrompt({ product, audience, channels });
    router.push(`/home?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,#101521,#0b0e16)] p-6 text-white sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
          Бизнес Завод · Маркетинг
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Полный маркетинговый комплект
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-white/60">
          Взяла сильную часть из твоего marketing-ai: один бриф превращается в оффер,
          сегменты аудитории, контент-план, идеи роликов, рекламу, скрипт продаж и разбор конкурентов.
        </p>
      </div>
      <div className="grid gap-5 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Что продаём?</span>
          <textarea
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            rows={4}
            placeholder="Например: страхование ипотечной квартиры"
            className="resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Кому продаём?</span>
          <textarea
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            rows={4}
            placeholder="Например: собственники ипотечных квартир, которые продлевают страховку"
            className="resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">Где будем продвигать?</legend>
          <div className="flex flex-wrap gap-2">
            {MARKETING_CHANNELS.map((channel) => {
              const active = channels.includes(channel);
              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => toggleChannel(channel)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {channel}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4 sm:grid-cols-2">
          {[
            'Оффер и CTA',
            '5 сегментов ЦА',
            'Контент-план на 7 дней',
            '10 идей коротких роликов',
            'Рекламные объявления',
            'Скрипт продаж',
            'Разбор конкурентов',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span aria-hidden="true" className="text-[var(--accent)]">✓</span>
              {item}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!canContinue}
            onClick={openInOsa}
            className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Передать AI-директору
          </button>
          <span className="text-sm text-[var(--text-secondary)]">
            Перед запуском запрос можно будет отредактировать.
          </span>
        </div>
      </div>
    </section>
  );
}
