'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import {
  scheduleLeadFollowUp,
  updateLeadStatusQuick,
} from '@/app/(dashboard)/crm/actions';
import { LeadForm } from '@/components/crm/lead-form';
import type { CrmLead, LeadStatus } from '@/types/crm';

type CrmPipelineProps = {
  leads: CrmLead[];
  followUpsByLead: Record<string, string>;
};

const COLUMNS: Array<{
  status: LeadStatus;
  title: string;
  subtitle: string;
  accent: string;
}> = [
  { status: 'new', title: 'Новые', subtitle: 'ещё не связывались', accent: '#69e4ee' },
  { status: 'contacted', title: 'Связались', subtitle: 'контакт уже был', accent: '#f1c96c' },
  { status: 'qualified', title: 'Интерес', subtitle: 'есть потенциал сделки', accent: '#a78bfa' },
  { status: 'won', title: 'Сделка', subtitle: 'успешно закрыто', accent: '#86efac' },
  { status: 'lost', title: 'Отказ', subtitle: 'не актуально', accent: '#fca5a5' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function CrmPipeline({ leads, followUpsByLead }: CrmPipelineProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = {
    total: leads.length,
    new: leads.filter((lead) => lead.status === 'new').length,
    contacted: leads.filter((lead) => lead.status === 'contacted').length,
    qualified: leads.filter((lead) => lead.status === 'qualified').length,
    won: leads.filter((lead) => lead.status === 'won').length,
  };

  const moveLead = (leadId: string, status: LeadStatus) => {
    setPendingId(leadId);
    startTransition(async () => {
      await updateLeadStatusQuick(leadId, status);
      window.location.reload();
    });
  };

  const scheduleFollowUp = (leadId: string, days: 1 | 3 | 7) => {
    setPendingId(leadId);
    startTransition(async () => {
      await scheduleLeadFollowUp(leadId, days);
      window.location.reload();
    });
  };

  const openEdit = (lead: CrmLead) => {
    setSelectedLead(lead);
    setFormOpen(true);
  };

  return (
    <main className="relative mx-auto w-full max-w-[1480px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.10),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[20%] top-20 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.08),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
              БИЗНЕС ЗАВОД · CRM
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(3rem,5vw,5.5rem)] font-black leading-[.92] tracking-[-.065em] text-[#fff8e7]">
              Лиды не теряются.
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                OSA ведёт их дальше.
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">
              Scout находит контакт, OSA готовит персональное сообщение, WhatsApp / SMS / голосовой агент
              связываются — а статус остаётся здесь.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedLead(null);
                setFormOpen(true);
              }}
              className="rounded-[16px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-3 text-sm font-black text-[#1b1105]"
            >
              + Новый лид
            </button>
            <Link
              href="/modules/communicate/studio"
              className="rounded-[16px] border border-[#69e4ee]/16 bg-[#69e4ee]/[0.04] px-5 py-3 text-sm font-black text-[#bff8fb]"
            >
              Найти через Scout →
            </Link>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Всего', counts.total],
            ['Новые', counts.new],
            ['Связались', counts.contacted],
            ['Интерес', counts.qualified],
            ['Сделки', counts.won],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[18px] border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[.11em] text-white/36">{label}</p>
              <p className="mt-2 text-3xl font-black tracking-[-.04em] text-[#fff8e7]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 overflow-x-auto pb-4">
        <div className="grid min-w-[1180px] grid-cols-5 gap-3">
          {COLUMNS.map((column) => {
            const columnLeads = leads.filter((lead) => lead.status === column.status);

            return (
              <div
                key={column.status}
                className="min-h-[620px] rounded-[26px] border border-white/[0.075] bg-[#080c12] p-3"
              >
                <div className="flex items-start justify-between gap-3 px-2 py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: column.accent }}
                      />
                      <h2 className="text-sm font-black text-[#fff8e7]">{column.title}</h2>
                    </div>
                    <p className="mt-1 text-[11px] text-white/38">{column.subtitle}</p>
                  </div>
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[10px] font-black text-white/48">
                    {columnLeads.length}
                  </span>
                </div>

                <div className="mt-2 grid gap-2">
                  {columnLeads.length ? (
                    columnLeads.map((lead) => (
                      <article
                        key={lead.id}
                        className="rounded-[20px] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.015))] p-4 transition hover:border-[#69e4ee]/18"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => openEdit(lead)}
                            className="min-w-0 text-left"
                          >
                            <h3 className="truncate text-base font-black text-[#fff8e7]">{lead.name}</h3>
                            <p className="mt-1 truncate text-xs text-white/42">
                              {lead.source || 'Источник не указан'}
                            </p>
                          </button>
                          <span className="shrink-0 text-[10px] font-bold text-white/28">
                            {formatDate(lead.created_at)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-1.5 text-xs text-white/58">
                          <p className="truncate">{lead.phone || 'Телефон —'}</p>
                          <p className="truncate">{lead.email || 'Email —'}</p>
                        </div>

                        {lead.notes ? (
                          <p className="mt-3 line-clamp-3 text-xs leading-5 text-white/42">
                            {lead.notes}
                          </p>
                        ) : null}

                        {followUpsByLead[lead.id] ? (
                          <div className="mt-3 rounded-xl border border-[#f1c96c]/12 bg-[#f1c96c]/[0.035] px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[.10em] text-[#f4d878]">
                              СЛЕДУЮЩИЙ КОНТАКТ
                            </p>
                            <p className="mt-1 text-xs font-bold text-white/70">
                              {new Intl.DateTimeFormat('ru-RU', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(new Date(followUpsByLead[lead.id]))}
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {lead.phone ? (
                            <>
                              <Link
                                href={
                                  '/modules/communicate/studio?phone=' +
                                  encodeURIComponent(lead.phone) +
                                  '&channel=whatsapp&lead=' +
                                  encodeURIComponent(lead.id)
                                }
                                className="rounded-xl border border-emerald-300/12 bg-emerald-300/[0.035] px-2.5 py-2 text-center text-[10px] font-black text-emerald-200"
                              >
                                WhatsApp
                              </Link>
                              <Link
                                href={
                                  '/modules/voice-agent/studio?phone=' +
                                  encodeURIComponent(lead.phone) +
                                  '&lead=' +
                                  encodeURIComponent(lead.id)
                                }
                                className="rounded-xl border border-[#69e4ee]/14 bg-[#69e4ee]/[0.035] px-2.5 py-2 text-center text-[10px] font-black text-[#a8f3f8]"
                              >
                                Позвонить
                              </Link>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEdit(lead)}
                              className="col-span-2 rounded-xl border border-white/[0.08] px-2.5 py-2 text-[10px] font-bold text-white/50"
                            >
                              Добавить контакт
                            </button>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="mr-1 text-[9px] font-black uppercase tracking-[.08em] text-white/30">
                            Напомнить:
                          </span>
                          {([1, 3, 7] as const).map((days) => (
                            <button
                              key={days}
                              type="button"
                              disabled={isPending && pendingId === lead.id}
                              onClick={() => scheduleFollowUp(lead.id, days)}
                              className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-2 py-1.5 text-[9px] font-black text-white/52 hover:border-[#f1c96c]/16 hover:text-[#f4d878] disabled:opacity-30"
                            >
                              +{days}д
                            </button>
                          ))}
                        </div>

                        <label className="mt-3 block">
                          <span className="sr-only">Статус лида</span>
                          <select
                            value={lead.status}
                            disabled={isPending && pendingId === lead.id}
                            onChange={(event) =>
                              moveLead(lead.id, event.target.value as LeadStatus)
                            }
                            className="w-full rounded-xl border border-white/[0.08] bg-[#0a0e15] px-3 py-2 text-[11px] font-bold text-white/66 outline-none"
                          >
                            {COLUMNS.map((option) => (
                              <option key={option.status} value={option.status}>
                                {option.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-white/[0.07] p-5 text-center text-xs leading-5 text-white/28">
                      Пока пусто
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <LeadForm
        key={selectedLead?.id ?? 'new'}
        open={formOpen}
        mode={selectedLead ? 'edit' : 'create'}
        lead={selectedLead}
        onClose={() => setFormOpen(false)}
      />
    </main>
  );
}
