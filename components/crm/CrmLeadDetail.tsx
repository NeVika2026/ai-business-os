'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import {
  addLeadNote,
  generateLeadNextStepAction,
  updateLeadStatusQuick,
} from '@/app/(dashboard)/crm/actions';
import { LeadFollowUpControls } from '@/components/crm/LeadFollowUpControls';
import type { CrmFollowUp } from '@/lib/crm/follow-ups';
import type { LeadStatus } from '@/types/crm';
import { LEAD_STATUS_LABELS } from '@/types/crm';

type LeadDetail = {
  id: string;
  projectId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  lastContactAt: string | null;
  createdAt: string;
};

type LeadTimelineEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

type CrmLeadDetailProps = {
  lead: LeadDetail;
  timeline: LeadTimelineEvent[];
  nextFollowUp: CrmFollowUp | null;
};

const STATUS_ORDER: LeadStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost'];

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function payloadText(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === 'string' ? value : '';
}

function eventPresentation(event: LeadTimelineEvent) {
  switch (event.type) {
    case 'crm_lead_created':
      return {
        title: 'Лид добавлен в CRM',
        text: payloadText(event.payload, 'source') || 'Карточка создана.',
        tone: 'cyan',
      };
    case 'crm_lead_imported':
      return {
        title: 'Лид найден через Scout',
        text: payloadText(event.payload, 'source') || 'Публичный профиль сохранён в CRM.',
        tone: 'cyan',
      };
    case 'crm_lead_status_changed':
      return {
        title: 'Статус изменён',
        text:
          (payloadText(event.payload, 'from') || '—') +
          ' → ' +
          (payloadText(event.payload, 'to') || '—'),
        tone: 'gold',
      };
    case 'crm_followup_scheduled':
    case 'crm_followup_rescheduled':
      return {
        title:
          event.type === 'crm_followup_rescheduled'
            ? 'Напоминание перенесено'
            : 'Назначен следующий контакт',
        text: [
          payloadText(event.payload, 'due_at')
            ? formatDateTime(payloadText(event.payload, 'due_at'))
            : 'Дата сохранена.',
          payloadText(event.payload, 'note'),
        ]
          .filter(Boolean)
          .join(' · '),
        tone: 'gold',
      };
    case 'crm_followup_completed':
      return {
        title: 'Напоминание выполнено',
        text: 'Запланированный контакт отмечен как выполненный.',
        tone: 'green',
      };
    case 'crm_followup_cancelled':
      return {
        title: 'Напоминание отменено',
        text: 'Запланированный контакт снят.',
        tone: 'neutral',
      };
    case 'crm_note_added':
      return {
        title: 'Заметка',
        text: payloadText(event.payload, 'note'),
        tone: 'neutral',
      };
    case 'crm_osa_next_step':
      return {
        title: 'OSA предложила следующий шаг',
        text: payloadText(event.payload, 'text'),
        tone: 'violet',
      };
    case 'crm_whatsapp_sent':
      return {
        title: 'WhatsApp отправлен',
        text: payloadText(event.payload, 'text'),
        tone: 'green',
      };
    case 'crm_whatsapp_received':
      return {
        title: 'Ответ клиента · WhatsApp',
        text: payloadText(event.payload, 'text'),
        tone: 'cyan',
      };
    case 'crm_sms_sent':
      return {
        title: 'SMS отправлено',
        text: payloadText(event.payload, 'text'),
        tone: 'green',
      };
    case 'crm_sms_received':
      return {
        title: 'Ответ клиента · SMS',
        text: payloadText(event.payload, 'text'),
        tone: 'cyan',
      };
    case 'crm_voice_call_completed':
      return {
        title: 'AI-звонок завершён',
        text:
          payloadText(event.payload, 'summary') ||
          payloadText(event.payload, 'transcript') ||
          'Расшифровка звонка сохранена.',
        tone: 'violet',
      };
    default:
      return {
        title: event.type.replaceAll('_', ' '),
        text:
          payloadText(event.payload, 'text') ||
          payloadText(event.payload, 'note') ||
          payloadText(event.payload, 'message') ||
          '',
        tone: 'neutral',
      };
  }
}

function toneClasses(tone: string) {
  if (tone === 'green') return 'border-emerald-300/15 bg-emerald-300/[0.035]';
  if (tone === 'gold') return 'border-[#f1c96c]/15 bg-[#f1c96c]/[0.035]';
  if (tone === 'violet') return 'border-violet-300/15 bg-violet-300/[0.035]';
  if (tone === 'cyan') return 'border-[#69e4ee]/15 bg-[#69e4ee]/[0.035]';
  return 'border-white/[0.07] bg-white/[0.02]';
}

export function CrmLeadDetail({
  lead,
  timeline,
  nextFollowUp,
}: CrmLeadDetailProps) {
  const [note, setNote] = useState('');
  const [osaText, setOsaText] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const runOsa = () => {
    setMessage('');
    setOsaText('');
    startTransition(async () => {
      const result = await generateLeadNextStepAction(lead.id);
      if (result.status === 'failed') {
        setMessage(result.message);
        return;
      }
      setOsaText(result.text);
      window.location.reload();
    });
  };

  const saveNote = () => {
    if (!note.trim()) return;
    setMessage('');
    startTransition(async () => {
      await addLeadNote(lead.id, note);
      setNote('');
      window.location.reload();
    });
  };

  const changeStatus = (status: LeadStatus) => {
    startTransition(async () => {
      await updateLeadStatusQuick(lead.id, status);
      window.location.reload();
    });
  };

  const communicationBase =
    '/modules/communicate/studio?lead=' +
    encodeURIComponent(lead.id) +
    (lead.phone ? '&phone=' + encodeURIComponent(lead.phone) : '') +
    (lead.projectId ? '&project=' + encodeURIComponent(lead.projectId) : '');

  const callHref =
    '/modules/voice-agent/studio?lead=' +
    encodeURIComponent(lead.id) +
    (lead.phone ? '&phone=' + encodeURIComponent(lead.phone) : '') +
    (lead.projectId ? '&project=' + encodeURIComponent(lead.projectId) : '');

  return (
    <main className="relative mx-auto w-full max-w-[1380px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.10),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/crm" className="text-sm font-bold text-white/52 hover:text-white">
            ← CRM
          </Link>
          <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.10em] text-white/48">
            карточка лида
          </span>
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[.16em] text-[#79eaf2]">
              {lead.source || 'CRM'}
            </p>
            <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.3rem)] font-black leading-[.92] tracking-[-.06em] text-[#fff8e7]">
              {lead.name}
            </h1>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-white/62">
              <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2">
                {lead.phone || 'Телефон не указан'}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2">
                {lead.email || 'Email не указан'}
              </span>
              <span className="rounded-full border border-[#f1c96c]/14 bg-[#f1c96c]/[0.035] px-3 py-2 font-bold text-[#f4d878]">
                {LEAD_STATUS_LABELS[lead.status]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
            <Link
              href={communicationBase + '&channel=whatsapp'}
              className="rounded-[15px] border border-emerald-300/14 bg-emerald-300/[0.04] px-4 py-3 text-center text-xs font-black text-emerald-200"
            >
              WhatsApp
            </Link>
            <Link
              href={communicationBase + '&channel=sms'}
              className="rounded-[15px] border border-white/[0.09] bg-white/[0.02] px-4 py-3 text-center text-xs font-black text-white/70"
            >
              SMS
            </Link>
            <Link
              href={callHref}
              className="rounded-[15px] border border-[#69e4ee]/14 bg-[#69e4ee]/[0.04] px-4 py-3 text-center text-xs font-black text-[#a8f3f8]"
            >
              AI-звонок
            </Link>
            {lead.projectId ? (
              <Link
                href={'/workspace/' + encodeURIComponent(lead.projectId)}
                className="rounded-[15px] border border-[#f1c96c]/14 bg-[#f1c96c]/[0.035] px-4 py-3 text-center text-xs font-black text-[#f4d878]"
              >
                Проект
              </Link>
            ) : (
              <span className="rounded-[15px] border border-white/[0.06] px-4 py-3 text-center text-xs text-white/26">
                Нет проекта
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <div className="grid content-start gap-5">
          <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
              СТАТУС
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {STATUS_ORDER.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isPending}
                  onClick={() => changeStatus(status)}
                  className={[
                    'rounded-[14px] border px-3 py-2.5 text-xs font-black transition',
                    lead.status === status
                      ? 'border-[#69e4ee]/26 bg-[#69e4ee]/[0.06] text-[#bff8fb]'
                      : 'border-white/[0.07] bg-white/[0.02] text-white/52',
                  ].join(' ')}
                >
                  {LEAD_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
              СЛЕДУЮЩИЙ КОНТАКТ
            </p>
            <p className="mt-3 text-lg font-black text-[#fff8e7]">
              {nextFollowUp ? formatDateTime(nextFollowUp.dueAt) : 'Не назначен'}
            </p>
            <LeadFollowUpControls leadId={lead.id} followUp={nextFollowUp} />
          </div>

          <div className="rounded-[28px] border border-violet-300/12 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,.08),transparent_45%),#080c12] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-violet-200">
              OSA · СЛЕДУЮЩИЙ ШАГ
            </p>
            <p className="mt-3 text-sm leading-6 text-white/58">
              OSA смотрит карточку и последние события и предлагает одно конкретное действие.
            </p>
            {osaText ? (
              <p className="mt-4 rounded-[16px] border border-violet-300/10 bg-violet-300/[0.03] p-4 text-sm leading-6 text-white/78">
                {osaText}
              </p>
            ) : null}
            <button
              type="button"
              onClick={runOsa}
              disabled={isPending}
              className="mt-4 w-full rounded-[15px] border border-violet-300/16 bg-violet-300/[0.05] px-4 py-3 text-xs font-black text-violet-100 disabled:opacity-35"
            >
              {isPending ? 'OSA думает…' : 'Что делать дальше →'}
            </button>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
              ЗАМЕТКА
            </p>
            <textarea
              rows={5}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Что важно не забыть по этому клиенту…"
              className="mt-4 w-full resize-none rounded-[17px] border border-white/[0.08] bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/28"
            />
            <button
              type="button"
              onClick={saveNote}
              disabled={!note.trim() || isPending}
              className="mt-3 w-full rounded-[14px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-4 py-3 text-xs font-black text-[#1b1105] disabled:opacity-35"
            >
              Сохранить заметку
            </button>
            {message ? <p className="mt-3 text-xs leading-5 text-amber-100/70">{message}</p> : null}
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-white/34">
              КОНТЕКСТ
            </p>
            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.10em] text-white/28">Создан</p>
                <p className="mt-1 text-white/66">{formatDateTime(lead.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.10em] text-white/28">Последний контакт</p>
                <p className="mt-1 text-white/66">{formatDateTime(lead.lastContactAt)}</p>
              </div>
              {lead.notes ? (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.10em] text-white/28">Основной комментарий</p>
                  <p className="mt-1 whitespace-pre-wrap leading-6 text-white/60">{lead.notes}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
                ИСТОРИЯ
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                Всё общение в одном месте
              </h2>
            </div>
            <span className="rounded-full border border-white/[0.07] px-3 py-1.5 text-[10px] font-black text-white/40">
              {timeline.length} событий
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            {timeline.length ? (
              timeline.map((event) => {
                const presentation = eventPresentation(event);
                return (
                  <article
                    key={event.id}
                    className={[
                      'rounded-[20px] border p-4',
                      toneClasses(presentation.tone),
                    ].join(' ')}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-sm font-black text-[#fff8e7]">
                        {presentation.title}
                      </h3>
                      <time className="text-[10px] font-bold text-white/30">
                        {formatDateTime(event.createdAt)}
                      </time>
                    </div>
                    {presentation.text ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/64">
                        {presentation.text}
                      </p>
                    ) : null}
                    {event.type === 'crm_voice_call_completed' &&
                    payloadText(event.payload, 'record_url') ? (
                      <a
                        href={payloadText(event.payload, 'record_url')}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-bold text-white/62"
                      >
                        Слушать запись ↗
                      </a>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="rounded-[20px] border border-dashed border-white/[0.08] p-8 text-center text-sm leading-6 text-white/34">
                История пока пустая. Первое сообщение, звонок, заметка или смена статуса появятся здесь.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
