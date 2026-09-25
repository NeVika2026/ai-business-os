'use client';

import { useState, useTransition } from 'react';

import {
  testPublishingConnectionAction,
  type PublishingDiagnosticChannel,
  type PublishingDiagnosticResult,
} from '@/app/(dashboard)/modules/publish/studio/actions';

type Props = {
  configured: PublishingDiagnosticChannel[];
};

const CHANNELS: Array<{
  id: PublishingDiagnosticChannel;
  label: string;
  short: string;
}> = [
  { id: 'telegram', label: 'Telegram', short: 'TG' },
  { id: 'vk', label: 'ВКонтакте', short: 'VK' },
  { id: 'youtube', label: 'YouTube', short: 'YT' },
  { id: 'instagram', label: 'Instagram Reels', short: 'IG' },
  { id: 'tiktok', label: 'TikTok', short: 'TT' },
  { id: 'max', label: 'MAX', short: 'MX' },
];

export function PublishingDiagnostics({ configured }: Props) {
  const [results, setResults] = useState<
    Partial<Record<PublishingDiagnosticChannel, PublishingDiagnosticResult>>
  >({});
  const [checking, setChecking] = useState<PublishingDiagnosticChannel | null>(null);
  const [isPending, startTransition] = useTransition();

  const check = (channel: PublishingDiagnosticChannel) => {
    if (isPending || !configured.includes(channel)) return;

    setChecking(channel);
    startTransition(async () => {
      const result = await testPublishingConnectionAction(channel);
      setResults((current) => ({ ...current, [channel]: result }));
      setChecking(null);
    });
  };

  const checkAll = () => {
    if (isPending) return;

    startTransition(async () => {
      for (const channel of CHANNELS) {
        if (!configured.includes(channel.id)) continue;
        setChecking(channel.id);
        const result = await testPublishingConnectionAction(channel.id);
        setResults((current) => ({ ...current, [channel.id]: result }));
      }
      setChecking(null);
    });
  };

  return (
    <section className="mx-auto w-full max-w-6xl rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 text-[#f7f2e8] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#79eaf2]">
            ДИАГНОСТИКА ПУБЛИКАЦИИ
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">
            Проверка реальных подключений
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Проверка ничего не публикует. Бизнес-завод только обращается к API площадки
            и подтверждает, что текущий токен и аккаунт действительно работают.
          </p>
        </div>
        <button
          type="button"
          onClick={checkAll}
          disabled={isPending || configured.length === 0}
          className="rounded-xl border border-[#69e4ee]/18 bg-[#69e4ee]/[0.04] px-4 py-2.5 text-xs font-black text-[#bff7fa] disabled:opacity-35"
        >
          {isPending ? 'Проверяю…' : 'Проверить все'}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CHANNELS.map((channel) => {
          const isConfigured = configured.includes(channel.id);
          const result = results[channel.id];

          return (
            <article
              key={channel.id}
              className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black tracking-[.12em] text-[#f1c96c]">
                    {channel.short}
                  </span>
                  <h3 className="mt-1 text-base font-black text-[#fff8e7]">
                    {channel.label}
                  </h3>
                </div>
                <span
                  className={[
                    'rounded-full border px-2 py-1 text-[10px] font-bold',
                    result?.ok
                      ? 'border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-200'
                      : result && !result.ok
                        ? 'border-red-300/15 bg-red-300/[0.05] text-red-200'
                        : isConfigured
                          ? 'border-[#69e4ee]/15 bg-[#69e4ee]/[0.04] text-[#bff7fa]'
                          : 'border-white/[0.08] text-white/35',
                  ].join(' ')}
                >
                  {result?.ok
                    ? 'РАБОТАЕТ'
                    : result
                      ? 'ОШИБКА'
                      : isConfigured
                        ? 'НАСТРОЕНО'
                        : 'НЕ НАСТРОЕНО'}
                </span>
              </div>

              <p className="mt-3 min-h-10 text-xs leading-5 text-white/48">
                {result?.detail ||
                  (isConfigured
                    ? 'Токены найдены. Запустите проверку API.'
                    : 'Для этого канала не хватает обязательных реквизитов.')}
              </p>

              <button
                type="button"
                disabled={!isConfigured || isPending}
                onClick={() => check(channel.id)}
                className="mt-3 w-full rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-black text-white/62 disabled:opacity-30"
              >
                {checking === channel.id ? 'Проверяю…' : 'Проверить подключение'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
