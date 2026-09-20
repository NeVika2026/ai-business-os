'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';

import { resolveLeadFollowUp, scheduleLeadFollowUp } from '@/app/(dashboard)/crm/actions';
import {
  type CrmFollowUp,
  followUpNote,
  followUpPreset,
  toLocalDateTime,
} from '@/lib/crm/follow-ups';

export function LeadFollowUpControls({
  leadId,
  followUp,
}: {
  leadId: string;
  followUp: CrmFollowUp | null;
}) {
  const router = useRouter();
  const inputId = useId();
  const [editing, setEditing] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const savedNote = followUpNote(followUp?.description);

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    setMessage('');
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await action();
        setMessage(result.message);
        setFailed(!result.ok);
        if (result.ok) setEditing(false);
      } catch {
        setFailed(true);
        setMessage('Не удалось связаться с сервером. Попробуйте ещё раз.');
      }
      router.refresh();
    });
  }

  function schedule(dueAt: string, comment: string) {
    run(() =>
      scheduleLeadFollowUp(leadId, dueAt, {
        note: comment,
        ...(followUp ? { taskId: followUp.id, expectedDueAt: followUp.dueAt } : {}),
      }),
    );
  }

  const buttonClass =
    'rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2.5 text-xs font-bold text-white/70 hover:border-[#f1c96c]/30 hover:text-[#f4d878] disabled:cursor-wait disabled:opacity-45';

  return (
    <div className="mt-4 space-y-3" aria-busy={pending}>
      {savedNote ? (
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/65">
          {savedNote}
        </p>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        {([1, 3, 7] as const).map((days) => (
          <button
            key={days}
            type="button"
            disabled={pending}
            className={buttonClass}
            onClick={() => schedule(followUpPreset(days, new Date()), savedNote)}
          >
            {days === 1 ? 'Завтра' : `Через ${days} дн.`}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-4 text-white/40">
        Быстрый выбор — на 11:00 по времени вашего устройства.
      </p>
      <button
        type="button"
        disabled={pending}
        aria-expanded={editing}
        aria-controls={inputId + '-form'}
        className={buttonClass + ' w-full'}
        onClick={() => {
          setDateValue(toLocalDateTime(followUp?.dueAt ?? followUpPreset(1, new Date())));
          setNote(savedNote);
          setEditing(!editing);
        }}
      >
        {editing ? 'Скрыть форму' : followUp ? 'Перенести · дата и время' : 'Выбрать дату и время'}
      </button>
      {editing ? (
        <form
          id={inputId + '-form'}
          className="space-y-3 rounded-2xl border border-white/[0.08] p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const date = new Date(dateValue);
            if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
              setFailed(true);
              setMessage('Выберите дату и время в будущем.');
              return;
            }
            schedule(date.toISOString(), note);
          }}
        >
          <div>
            <label htmlFor={inputId} className="block text-xs font-bold text-white/65">
              Дата и время
            </label>
            <input
              id={inputId}
              type="datetime-local"
              required
              disabled={pending}
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
              className="mt-2 w-full min-w-0 rounded-xl border border-white/15 bg-[#0b1119] px-3 py-2.5 text-sm text-white [color-scheme:dark]"
            />
            <p className="mt-1 text-[11px] text-white/40">По времени вашего устройства.</p>
          </div>
          <div>
            <label htmlFor={inputId + '-note'} className="block text-xs font-bold text-white/65">
              Что нужно сделать
            </label>
            <textarea
              id={inputId + '-note'}
              disabled={pending}
              value={note}
              maxLength={2000}
              rows={3}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Например, обсудить предложение"
              className="mt-2 w-full rounded-xl border border-white/15 bg-[#0b1119] px-3 py-2.5 text-sm text-white placeholder:text-white/30"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl border border-[#f1c96c]/25 bg-[#f1c96c]/10 px-3 py-2.5 text-xs font-bold text-[#f4d878] disabled:opacity-45"
          >
            {pending ? 'Сохраняем…' : 'Сохранить напоминание'}
          </button>
        </form>
      ) : null}
      {followUp ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={pending}
            className={buttonClass + ' text-emerald-200'}
            onClick={() =>
              run(() => resolveLeadFollowUp(leadId, followUp.id, followUp.dueAt, 'done'))
            }
          >
            Выполнено
          </button>
          <button
            type="button"
            disabled={pending}
            className={buttonClass}
            onClick={() =>
              run(() => resolveLeadFollowUp(leadId, followUp.id, followUp.dueAt, 'cancelled'))
            }
          >
            Отменить
          </button>
        </div>
      ) : null}
      {message ? (
        <p
          role={failed ? 'alert' : 'status'}
          className={'text-xs leading-5 ' + (failed ? 'text-rose-200' : 'text-[#a8f3f8]')}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
