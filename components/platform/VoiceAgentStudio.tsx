'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  getVoiceAgentCallAction,
  getVoiceAgentConnectionStatusAction,
  startVoiceAgentCallAction,
  type VoiceAgentCallData,
  type VoiceAgentConnectionStatus,
} from '@/app/(dashboard)/modules/voice-agent/actions';

type VoiceAgentStudioProps = {
  projectId?: string | null;
  initialPhone?: string;
  initialLeadId?: string | null;
};

const EMPTY_STATUS: VoiceAgentConnectionStatus = {
  connected: false,
  provider: 'voicyfy',
  assistantConfigured: false,
  baseUrl: 'https://voicyfy.ru',
};

export function VoiceAgentStudio({
  projectId = null,
  initialPhone = '',
  initialLeadId = null,
}: VoiceAgentStudioProps) {
  const [connection, setConnection] = useState(EMPTY_STATUS);
  const [phone, setPhone] = useState(initialPhone);
  const [callerPhone, setCallerPhone] = useState('');
  const [firstPhrase, setFirstPhrase] = useState('Здравствуйте! Удобно сейчас говорить?');
  const [task, setTask] = useState('');
  const [consent, setConsent] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');
  const [call, setCall] = useState<VoiceAgentCallData | null>(null);
  const [isStarting, startTransition] = useTransition();
  const [isRefreshing, refreshTransition] = useTransition();
  const pollRef = useRef<number | null>(null);
  const pollAttemptsRef = useRef(0);

  useEffect(() => {
    void getVoiceAgentConnectionStatusAction().then(setConnection);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
  }, []);

  const refresh = (id = sessionId) => {
    if (!id || isRefreshing) return;

    refreshTransition(async () => {
      const result = await getVoiceAgentCallAction(id, projectId, initialLeadId);

      if (result.status === 'completed') {
        setCall(result.call);
        setMessage('Звонок завершён. Расшифровка и запись готовы.');
        pollAttemptsRef.current = 0;
        return;
      }

      if (result.status === 'failed') {
        setMessage(result.message);
        return;
      }

      setMessage(result.message);
      pollAttemptsRef.current += 1;

      if (pollAttemptsRef.current < 20) {
        pollRef.current = window.setTimeout(() => refresh(id), 6000);
      }
    });
  };

  const startCall = () => {
    if (!phone.trim() || !task.trim() || !consent || isStarting) return;

    setMessage('');
    setCall(null);
    pollAttemptsRef.current = 0;

    startTransition(async () => {
      const result = await startVoiceAgentCallAction({
        targetPhone: phone,
        callerPhone,
        firstPhrase,
        task,
        projectId,
      });

      if (result.status === 'failed') {
        setMessage(result.message);
        return;
      }

      setSessionId(result.sessionId);
      setMessage(result.message + ' Жду завершения разговора…');
      pollRef.current = window.setTimeout(() => refresh(result.sessionId), 6000);
    });
  };

  return (
    <main className="relative mx-auto w-full max-w-[1320px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.11),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[15%] top-44 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.10),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative grid gap-8 xl:grid-cols-[1fr_.7fr] xl:items-end">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
              БИЗНЕС ЗАВОД · ГОЛОСОВОЙ АГЕНТ
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(3rem,5vw,5.6rem)] font-black leading-[.92] tracking-[-.065em] text-[#fff8e7]">
              OSA сама
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                звонит клиенту.
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
              Укажите номер и задачу. Голосовой агент совершит исходящий звонок, после разговора
              сюда вернутся расшифровка, длительность и запись.
            </p>
          </div>

          <div
            className={[
              'rounded-[24px] border p-5',
              connection.connected
                ? 'border-emerald-300/14 bg-emerald-300/[0.035]'
                : 'border-[#f1c96c]/14 bg-[#f1c96c]/[0.03]',
            ].join(' ')}
          >
            <p className="text-[11px] font-black uppercase tracking-[.13em] text-white/46">
              ТЕЛЕФОНИЯ
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-lg font-black text-[#fff8e7]">Voicyfy</p>
              <span
                className={
                  connection.connected
                    ? 'rounded-full bg-emerald-300/[0.07] px-2.5 py-1 text-[10px] font-black text-emerald-200'
                    : 'rounded-full bg-[#f1c96c]/[0.07] px-2.5 py-1 text-[10px] font-black text-[#f3d681]'
                }
              >
                {connection.connected ? 'ПОДКЛЮЧЕНО' : 'НУЖНО ПОДКЛЮЧИТЬ'}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/56">
              Агент работает через серверное подключение. ID ассистента не показывается в браузере.
            </p>
            {!connection.connected ? (
              <Link
                href="/settings"
                className="mt-3 inline-flex rounded-xl border border-white/[0.10] px-3 py-2 text-xs font-bold text-white/70 hover:border-[#69e4ee]/22 hover:text-white"
              >
                Открыть интеграции →
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="relative mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
            ЗАДАЧА НА ЗВОНОК
          </p>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/76">Кому позвонить</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+7 999 123-45-67"
              className="rounded-[18px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-base text-white outline-none placeholder:text-white/34 focus:border-[#69e4ee]/28"
            />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/76">Первая фраза</span>
            <input
              value={firstPhrase}
              onChange={(event) => setFirstPhrase(event.target.value)}
              className="rounded-[18px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none focus:border-[#69e4ee]/28"
            />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/76">Что должен сделать агент</span>
            <textarea
              rows={7}
              value={task}
              onChange={(event) => setTask(event.target.value)}
              placeholder="Например: представься менеджером компании, уточни интерес к услуге, ответь на вопросы и договорись о следующем шаге…"
              className="resize-none rounded-[20px] border border-white/[0.09] bg-black/25 px-4 py-4 text-base leading-7 text-white outline-none placeholder:text-white/34 focus:border-[#69e4ee]/28"
            />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/68">Caller ID · необязательно</span>
            <input
              value={callerPhone}
              onChange={(event) => setCallerPhone(event.target.value)}
              placeholder="+7…"
              className="rounded-[18px] border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/28"
            />
          </label>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm leading-6 text-white/62">
              У меня есть законное основание связаться с этим человеком, и звонок не используется
              для нежелательного массового обзвона.
            </span>
          </label>

          <button
            type="button"
            onClick={startCall}
            disabled={!connection.connected || !phone.trim() || !task.trim() || !consent || isStarting}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] shadow-[0_18px_40px_-22px_rgba(241,201,108,.6)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isStarting ? 'Запускаю звонок…' : 'Позвонить сейчас →'}
          </button>

          {message ? (
            <p className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/66">
              {message}
            </p>
          ) : null}

          {sessionId ? (
            <button
              type="button"
              onClick={() => refresh()}
              disabled={isRefreshing}
              className="mt-3 w-full rounded-xl border border-white/[0.09] px-3 py-2.5 text-xs font-bold text-white/64 hover:border-[#69e4ee]/22 hover:text-white disabled:opacity-40"
            >
              {isRefreshing ? 'Проверяю…' : 'Обновить результат звонка'}
            </button>
          ) : null}
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
                ПОСЛЕ РАЗГОВОРА
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                Запись и расшифровка
              </h2>
            </div>
            {call ? (
              <span className="rounded-full border border-emerald-300/14 bg-emerald-300/[0.04] px-2.5 py-1 text-[10px] font-black text-emerald-200">
                ЗАВЕРШЁН
              </span>
            ) : null}
          </div>

          {!call ? (
            <div className="flex min-h-[610px] items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#69e4ee]/12 bg-[#69e4ee]/[0.035] text-3xl text-[#79eaf2] shadow-[0_0_48px_rgba(105,228,238,.08)]">
                  ◉
                </div>
                <p className="mt-5 text-xl font-black text-[#fff8e7]">
                  Агент готов к разговору
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/52">
                  После завершения звонка здесь появятся реплики клиента и агента, длительность,
                  стоимость и ссылка на аудиозапись.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <Stat label="Агент" value={call.assistantName || 'AI'} />
                <Stat
                  label="Длительность"
                  value={call.durationSeconds != null ? Math.round(call.durationSeconds) + ' сек' : '—'}
                />
                <Stat
                  label="Стоимость"
                  value={call.cost != null ? String(call.cost) : '—'}
                />
                <Stat label="Реплик" value={String(call.messagesCount)} />
              </div>

              {call.recordUrl ? (
                <a
                  href={call.recordUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-xl border border-[#f1c96c]/16 bg-[#f1c96c]/[0.035] px-4 py-2.5 text-xs font-black text-[#f4d878]"
                >
                  Открыть запись звонка ↗
                </a>
              ) : null}

              <div className="mt-5 grid gap-3">
                {call.dialog.length ? (
                  call.dialog.map((item, index) => {
                    const assistant = item.role === 'assistant';
                    return (
                      <div
                        key={index}
                        className={[
                          'max-w-[88%] rounded-[18px] border px-4 py-3',
                          assistant
                            ? 'ml-auto border-[#69e4ee]/12 bg-[#69e4ee]/[0.035]'
                            : 'border-white/[0.08] bg-white/[0.025]',
                        ].join(' ')}
                      >
                        <p
                          className={
                            assistant
                              ? 'text-[10px] font-black uppercase tracking-[.12em] text-[#79eaf2]'
                              : 'text-[10px] font-black uppercase tracking-[.12em] text-white/40'
                          }
                        >
                          {assistant ? 'OSA · АГЕНТ' : 'КЛИЕНТ'}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-white/78">{item.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-white/52">Текстовая расшифровка не получена.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.02] p-3">
      <p className="text-[10px] font-black uppercase tracking-[.11em] text-white/38">{label}</p>
      <p className="mt-1 text-sm font-black text-[#fff8e7]">{value}</p>
    </div>
  );
}
