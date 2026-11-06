'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

type WelcomeOfferCardProps = {
  active: boolean;
  regularPrice: number;
  price: number;
  savings: number;
  expiresAtIso: string;
};

export function WelcomeOfferCard({
  active,
  regularPrice,
  price,
  savings,
  expiresAtIso,
}: WelcomeOfferCardProps) {
  const expiresAt = useMemo(() => new Date(expiresAtIso).getTime(), [expiresAtIso]);
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    if (!active) return;

    const tick = () => setRemainingMs(Math.max(0, expiresAt - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [active, expiresAt]);

  const liveActive = active && remainingMs > 0;

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white p-7 shadow-[0_24px_70px_rgba(46,39,77,.10)] lg:p-9">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-[#7357ff]">
        Стартовое предложение
      </div>
      <h1 className="mt-3 text-3xl font-black tracking-tight lg:text-5xl">
        {liveActive ? 'Ваша цена новичка ещё действует' : 'Стартовое предложение завершено'}
      </h1>

      {liveActive ? (
        <>
          <div className="mt-7 flex flex-wrap items-end gap-4">
            <div className="text-5xl font-black">{formatMoney(price)}</div>
            <div className="pb-1 text-xl text-[#8a8f99] line-through">{formatMoney(regularPrice)}</div>
          </div>
          <div className="mt-3 font-bold text-[#7357ff]">Экономия {formatMoney(savings)}</div>
          <div className="mt-7 rounded-2xl bg-[#f6f0ea] p-5">
            <div className="text-sm font-bold text-[#60656f]">Цена действует ещё</div>
            <div className="mt-1 font-mono text-3xl font-black tracking-tight">
              {formatRemaining(remainingMs)}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#737883]">
              Таймер привязан к дате регистрации и не запускается заново после обновления страницы.
            </p>
          </div>
        </>
      ) : (
        <p className="mt-5 max-w-2xl leading-7 text-[#636873]">
          Персональное 24-часовое окно не продлевается автоматически. Актуальные бесплатные и платные решения доступны в каталоге.
        </p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/marketplace" className="rounded-full bg-[#1f2430] px-6 py-3 font-bold text-white">
          Выбрать продукт
        </Link>
        <Link href="/gotovoe" className="rounded-full border border-black/15 px-6 py-3 font-bold">
          Сначала бесплатно
        </Link>
      </div>
    </section>
  );
}
