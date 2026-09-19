'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { mergeDuplicateLeadsAction } from '@/app/(dashboard)/crm/actions';

type DuplicateLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  createdAt: string;
};

type DuplicateGroup = {
  key: string;
  kind: 'email' | 'phone';
  value: string;
  leads: DuplicateLead[];
};

type CrmDuplicatesProps = {
  groups: DuplicateGroup[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function CrmDuplicates({ groups }: CrmDuplicatesProps) {
  const [primaryByGroup, setPrimaryByGroup] = useState<Record<string, string>>(
    Object.fromEntries(groups.map((group) => [group.key, group.leads[0]?.id ?? ''])),
  );
  const [messageByGroup, setMessageByGroup] = useState<Record<string, string>>({});
  const [busyGroup, setBusyGroup] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const merge = (group: DuplicateGroup) => {
    const primaryLeadId = primaryByGroup[group.key] || group.leads[0]?.id;
    if (!primaryLeadId || isPending) return;

    const duplicateLeadIds = group.leads
      .map((lead) => lead.id)
      .filter((id) => id !== primaryLeadId);

    setBusyGroup(group.key);
    setMessageByGroup((current) => ({ ...current, [group.key]: '' }));

    startTransition(async () => {
      try {
        const result = await mergeDuplicateLeadsAction({
          primaryLeadId,
          duplicateLeadIds,
        });
        setMessageByGroup((current) => ({
          ...current,
          [group.key]: result.message,
        }));
        window.location.reload();
      } catch (error) {
        setMessageByGroup((current) => ({
          ...current,
          [group.key]:
            error instanceof Error ? error.message : 'Не удалось объединить дубли.',
        }));
      } finally {
        setBusyGroup(null);
      }
    });
  };

  const duplicateCount = groups.reduce(
    (sum, group) => sum + Math.max(0, group.leads.length - 1),
    0,
  );

  return (
    <main className="relative mx-auto w-full max-w-[1380px] overflow-hidden pb-16 text-[#f7f2e8]">
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
                ДУБЛИ
              </p>
            </div>

            <h1 className="mt-5 max-w-4xl text-[clamp(3rem,5vw,5.2rem)] font-black leading-[.92] tracking-[-.06em] text-[#fff8e7]">
              Одна история
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                вместо пяти карточек.
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/68">
              Находит совпадения по email и телефону. Перед объединением вы выбираете, какая карточка останется основной.
            </p>
          </div>

          <div className="grid min-w-[220px] grid-cols-2 gap-2">
            <Metric label="Групп" value={groups.length} />
            <Metric label="Лишних карточек" value={duplicateCount} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4">
        {groups.length ? (
          groups.map((group) => {
            const selectedPrimary = primaryByGroup[group.key] || group.leads[0]?.id || '';
            const busy = isPending && busyGroup === group.key;

            return (
              <article
                key={group.key}
                className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#69e4ee]/14 bg-[#69e4ee]/[0.035] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.10em] text-[#a8f3f8]">
                        {group.kind === 'email' ? 'EMAIL' : 'ТЕЛЕФОН'}
                      </span>
                      <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[10px] font-black text-white/42">
                        {group.leads.length} карточки
                      </span>
                    </div>
                    <h2 className="mt-3 break-all text-xl font-black text-[#fff8e7]">{group.value}</h2>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => merge(group)}
                    className="rounded-[15px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-3 text-xs font-black text-[#1b1105] disabled:opacity-35"
                  >
                    {busy ? 'Объединяю…' : 'Объединить дубли →'}
                  </button>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  {group.leads.map((lead) => {
                    const isPrimary = selectedPrimary === lead.id;
                    return (
                      <label
                        key={lead.id}
                        className={[
                          'block cursor-pointer rounded-[20px] border p-4 transition',
                          isPrimary
                            ? 'border-[#69e4ee]/22 bg-[#69e4ee]/[0.04]'
                            : 'border-white/[0.07] bg-white/[0.018]',
                        ].join(' ')}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name={group.key}
                            checked={isPrimary}
                            onChange={() =>
                              setPrimaryByGroup((current) => ({
                                ...current,
                                [group.key]: lead.id,
                              }))
                            }
                            className="mt-1"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-black text-[#fff8e7]">{lead.name}</p>
                                <p className="mt-1 text-[11px] text-white/38">
                                  {lead.source || 'Источник не указан'} · {formatDate(lead.createdAt)}
                                </p>
                              </div>

                              {isPrimary ? (
                                <span className="rounded-full border border-[#69e4ee]/16 bg-[#69e4ee]/[0.05] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.08em] text-[#a8f3f8]">
                                  ОСТАВИТЬ
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-4 grid gap-2 text-xs text-white/58 sm:grid-cols-2">
                              <p className="truncate">{lead.phone || 'Телефон —'}</p>
                              <p className="truncate">{lead.email || 'Email —'}</p>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <span className="rounded-full border border-white/[0.07] px-2 py-1 text-[9px] font-black uppercase text-white/40">
                                {lead.status}
                              </span>
                              <Link
                                href={'/crm/' + encodeURIComponent(lead.id)}
                                onClick={(event) => event.stopPropagation()}
                                className="text-[10px] font-black text-white/48 hover:text-white"
                              >
                                Открыть карточку ↗
                              </Link>
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-[16px] border border-[#f1c96c]/10 bg-[#f1c96c]/[0.025] px-4 py-3 text-xs leading-5 text-white/48">
                  При объединении сохраняются сообщения, звонки и follow-up. Пустые поля основной карточки дополняются данными из дублей.
                </div>

                {messageByGroup[group.key] ? (
                  <p className="mt-3 text-sm leading-6 text-white/58">{messageByGroup[group.key]}</p>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className="rounded-[28px] border border-dashed border-white/[0.08] bg-[#080c12] p-12 text-center">
            <p className="text-2xl font-black text-[#fff8e7]">Явных дублей не найдено</p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/42">
              Совпадения по нормализованному телефону и email сейчас отсутствуют.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-black/20 p-4">
      <p className="text-[9px] font-black uppercase tracking-[.10em] text-white/32">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-[-.05em] text-[#fff8e7]">{value}</p>
    </div>
  );
}
