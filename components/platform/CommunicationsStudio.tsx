'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';

import {
  generateLeadOutreachMessageAction,
  getCommunicationsStatusAction,
  saveScoutLeadAction,
  scrapeScoutLeadAction,
  sendSmsMessageAction,
  sendWhatsAppMessageAction,
  type CommunicationChannel,
  type CommunicationsStatus,
  type ScoutPlatform,
} from '@/app/(dashboard)/modules/communicate/actions';

type CommunicationsStudioProps = {
  projectId?: string | null;
};

function getLeadString(
  lead: Record<string, unknown> | null,
  keys: string[],
): string {
  if (!lead) return '';
  for (const key of keys) {
    const value = lead[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  }
  return '';
}

function getLeadNumber(
  lead: Record<string, unknown> | null,
  key: string,
): number | null {
  if (!lead) return null;
  const value = lead[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const EMPTY_STATUS: CommunicationsStatus = {
  sms: { connected: false, provider: 'httpSMS', fromConfigured: false },
  whatsapp: {
    connected: false,
    provider: 'Evolution Go',
    baseUrlConfigured: false,
    tokenConfigured: false,
  },
  scout: { connected: false, provider: 'Scout' },
};

export function CommunicationsStudio({
  projectId = null,
}: CommunicationsStudioProps) {
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [channel, setChannel] = useState<CommunicationChannel>('whatsapp');
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState('');
  const [scoutPlatform, setScoutPlatform] = useState<ScoutPlatform>('instagram');
  const [scoutIdentifier, setScoutIdentifier] = useState('');
  const [scoutResult, setScoutResult] = useState<Record<string, unknown> | null>(null);
  const [scoutMessage, setScoutMessage] = useState('');
  const [savedProjectId, setSavedProjectId] = useState<string | null>(projectId);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void getCommunicationsStatusAction().then(setStatus);
  }, []);

  const connected = channel === 'sms' ? status.sms.connected : status.whatsapp.connected;

  const runScout = () => {
    if (!scoutIdentifier.trim() || isPending) return;

    setScoutMessage('');
    setScoutResult(null);

    startTransition(async () => {
      const response = await scrapeScoutLeadAction({
        platform: scoutPlatform,
        identifier: scoutIdentifier,
        enrich: true,
      });

      if (response.status === 'failed') {
        setScoutMessage(response.message);
        return;
      }

      setScoutResult(response.lead);
    });
  };

  const draftForLead = (nextChannel: CommunicationChannel) => {
    if (!scoutResult || isPending) return;

    const phone = getLeadString(scoutResult, ['phone']);
    if (phone) setTo(phone);
    setChannel(nextChannel);
    setResult('OSA готовит персональное сообщение…');

    startTransition(async () => {
      const response = await generateLeadOutreachMessageAction({
        lead: scoutResult,
        channel: nextChannel,
      });

      if (response.status === 'failed') {
        setResult(response.message);
        return;
      }

      setMessage(response.message);
      setResult('Сообщение подготовлено. Проверьте его перед отправкой.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const useLeadForMessage = (nextChannel: CommunicationChannel) => {
    const phone = getLeadString(scoutResult, ['phone']);
    const name = getLeadString(scoutResult, ['full_name', 'name', 'username']);

    setChannel(nextChannel);
    if (phone) setTo(phone);
    if (!message.trim()) {
      setMessage(
        name
          ? 'Здравствуйте, ' + name + '! Пишу по поводу возможного сотрудничества. Удобно обсудить?'
          : 'Здравствуйте! Пишу по поводу возможного сотрудничества. Удобно обсудить?',
      );
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveLead = () => {
    if (!scoutResult || isPending) return;

    setScoutMessage('');

    startTransition(async () => {
      const response = await saveScoutLeadAction({
        lead: scoutResult,
        projectId: savedProjectId,
      });

      if (response.status === 'failed') {
        setScoutMessage(response.message);
        return;
      }

      setSavedProjectId(response.projectId);
      setScoutMessage(response.message);
    });
  };

  const send = () => {
    if (!to.trim() || !message.trim() || !consent || isPending) return;

    setResult('');

    startTransition(async () => {
      const response =
        channel === 'sms'
          ? await sendSmsMessageAction({
              to,
              content: message,
              consentConfirmed: consent,
              projectId,
            })
          : await sendWhatsAppMessageAction({
              to,
              text: message,
              consentConfirmed: consent,
              projectId,
            });

      setResult(response.message);
    });
  };

  return (
    <main className="relative mx-auto w-full max-w-[1320px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.12),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative grid gap-7 xl:grid-cols-[1fr_.72fr] xl:items-end">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
              БИЗНЕС ЗАВОД · КОММУНИКАЦИИ
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(3rem,5vw,5.5rem)] font-black leading-[.92] tracking-[-.065em] text-[#fff8e7]">
              Нашли клиента.
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                Теперь связываемся.
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
              WhatsApp через Evolution Go, SMS через ваш Android-телефон с httpSMS, а Scout
              подключается как отдельный движок поиска и обогащения лидов.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <ProviderCard
              name="WhatsApp"
              provider="Evolution Go"
              connected={status.whatsapp.connected}
            />
            <ProviderCard
              name="SMS"
              provider="httpSMS"
              connected={status.sms.connected}
            />
            <ProviderCard
              name="Поиск контактов"
              provider="Scout"
              connected={status.scout.connected}
            />
          </div>
        </div>
      </section>

      <section className="relative mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
            КАНАЛ
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ['whatsapp', 'WhatsApp'],
              ['sms', 'SMS'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setChannel(id as CommunicationChannel)}
                className={[
                  'rounded-[16px] border px-4 py-3 text-sm font-black transition',
                  channel === id
                    ? 'border-[#69e4ee]/30 bg-[#69e4ee]/[0.06] text-[#bff8fb]'
                    : 'border-white/[0.08] bg-white/[0.02] text-white/60',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="mt-5 grid gap-2">
            <span className="text-sm font-bold text-white/76">Номер получателя</span>
            <input
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="+7 999 123-45-67"
              className="rounded-[18px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-base text-white outline-none placeholder:text-white/34 focus:border-[#69e4ee]/28"
            />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/76">Сообщение</span>
            <textarea
              rows={9}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Напишите сообщение или вставьте текст, который подготовила OSA…"
              className="resize-none rounded-[20px] border border-white/[0.09] bg-black/25 px-4 py-4 text-base leading-7 text-white outline-none placeholder:text-white/34 focus:border-[#69e4ee]/28"
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
              У меня есть законное основание связаться с этим человеком; это не нежелательная
              массовая рассылка.
            </span>
          </label>

          <button
            type="button"
            onClick={send}
            disabled={!connected || !to.trim() || !message.trim() || !consent || isPending}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isPending
              ? 'Отправляю…'
              : channel === 'whatsapp'
                ? 'Отправить в WhatsApp →'
                : 'Отправить SMS →'}
          </button>

          {!connected ? (
            <p className="mt-3 text-sm leading-6 text-amber-100/70">
              Этот канал ещё не подключён. Добавьте параметры подключения в интеграциях.
            </p>
          ) : null}

          {result ? (
            <p className="mt-3 rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/66">
              {result}
            </p>
          ) : null}
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
            ЦЕПОЧКА ПРОДАЖ
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
            Scout → OSA → WhatsApp / SMS
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
            Scout умеет собирать открытые профили с нескольких площадок, находить контактные
            данные, проверять email и оценивать лид. В Бизнес-Заводе это будет отдельный внешний
            worker, чтобы тяжёлый scraper не жил внутри Vercel.
          </p>

          <div className="mt-6 grid gap-3">
            {[
              ['01', 'Найти', 'Профили и компании по сегменту'],
              ['02', 'Обогатить', 'Email, сайт, телефон и признаки компании'],
              ['03', 'Оценить', 'Lead score и приоритет'],
              ['04', 'Подготовить', 'OSA пишет персональное сообщение'],
              ['05', 'Связаться', 'WhatsApp, SMS или другой разрешённый канал'],
              ['06', 'Сохранить', 'Контакт и результат общения остаются в проекте'],
            ].map(([number, title, detail]) => (
              <div
                key={number}
                className="grid grid-cols-[auto_1fr] gap-4 rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.04] text-[11px] font-black text-[#79eaf2]">
                  {number}
                </span>
                <div>
                  <p className="text-base font-black text-[#fff8e7]">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/52">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[22px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.025] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
              ПОИСК И ОБОГАЩЕНИЕ
            </p>
            <h3 className="mt-2 text-xl font-black text-[#fff8e7]">
              Проверить конкретный публичный профиль через Scout
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-[.34fr_1fr_auto]">
              <select
                value={scoutPlatform}
                onChange={(event) => setScoutPlatform(event.target.value as ScoutPlatform)}
                className="rounded-[16px] border border-white/[0.09] bg-[#0a0e15] px-3 py-3 text-sm text-white"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="linkedin">LinkedIn</option>
                <option value="github">GitHub</option>
                <option value="youtube">YouTube</option>
                <option value="twitch">Twitch</option>
                <option value="linkbio">Link-in-bio</option>
                <option value="pinterest">Pinterest</option>
              </select>
              <input
                value={scoutIdentifier}
                onChange={(event) => setScoutIdentifier(event.target.value)}
                placeholder="username, URL или идентификатор профиля"
                className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button
                type="button"
                onClick={runScout}
                disabled={!status.scout.connected || !scoutIdentifier.trim() || isPending}
                className="rounded-[16px] border border-[#69e4ee]/18 bg-[#69e4ee]/[0.05] px-4 py-3 text-sm font-black text-[#bff8fb] disabled:opacity-35"
              >
                Найти →
              </button>
            </div>

            {scoutMessage ? (
              <p className="mt-3 text-sm leading-6 text-amber-100/70">{scoutMessage}</p>
            ) : null}

            {scoutResult ? (
              <div className="mt-4 overflow-hidden rounded-[22px] border border-white/[0.08] bg-black/25">
                <div className="grid gap-4 border-b border-white/[0.07] p-5 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#69e4ee]/15 bg-[#69e4ee]/[0.05] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.10em] text-[#9cf1f6]">
                        {scoutPlatform}
                      </span>
                      {getLeadNumber(scoutResult, 'lead_score') !== null ? (
                        <span className="rounded-full border border-[#f1c96c]/15 bg-[#f1c96c]/[0.04] px-2.5 py-1 text-[10px] font-black text-[#f4d878]">
                          SCORE {getLeadNumber(scoutResult, 'lead_score')}/100
                        </span>
                      ) : null}
                    </div>
                    <h4 className="mt-3 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                      {getLeadString(scoutResult, ['full_name', 'name', 'username']) || 'Найденный лид'}
                    </h4>
                    {getLeadString(scoutResult, ['headline', 'bio', 'company']) ? (
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
                        {getLeadString(scoutResult, ['headline', 'bio', 'company'])}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                    <button
                      type="button"
                      onClick={() => draftForLead('whatsapp')}
                      disabled={!getLeadString(scoutResult, ['phone']) || isPending}
                      className="rounded-xl border border-emerald-300/14 bg-emerald-300/[0.04] px-3 py-2 text-xs font-black text-emerald-200 disabled:opacity-30"
                    >
                      OSA → WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => draftForLead('sms')}
                      disabled={!getLeadString(scoutResult, ['phone']) || isPending}
                      className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-black text-white/72 disabled:opacity-30"
                    >
                      OSA → SMS
                    </button>
                  </div>
                </div>

                <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2">
                  {[
                    ['Email', getLeadString(scoutResult, ['email'])],
                    ['Телефон', getLeadString(scoutResult, ['phone'])],
                    ['Компания', getLeadString(scoutResult, ['company'])],
                    ['Сайт', getLeadString(scoutResult, ['website'])],
                    ['Email confidence', getLeadString(scoutResult, ['email_score'])],
                    ['Email verified', getLeadString(scoutResult, ['email_verified'])],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#0a0f15] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[.11em] text-white/34">{label}</p>
                      <p className="mt-1 break-words text-sm font-bold text-white/78">{value || '—'}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 p-4">
                  <button
                    type="button"
                    onClick={saveLead}
                    className="rounded-xl border border-[#f1c96c]/16 bg-[#f1c96c]/[0.04] px-3 py-2 text-xs font-black text-[#f4d878]"
                  >
                    Сохранить в проект
                  </button>
                  <button
                    type="button"
                    onClick={() => useLeadForMessage('whatsapp')}
                    disabled={!getLeadString(scoutResult, ['phone'])}
                    className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-bold text-white/60 disabled:opacity-30"
                  >
                    Только подставить номер
                  </button>

                  {getLeadString(scoutResult, ['phone']) ? (
                    <Link
                      href={
                        '/modules/voice-agent/studio?phone=' +
                        encodeURIComponent(getLeadString(scoutResult, ['phone'])) +
                        (savedProjectId ? '&project=' + encodeURIComponent(savedProjectId) : '')
                      }
                      className="rounded-xl border border-[#69e4ee]/16 bg-[#69e4ee]/[0.04] px-3 py-2 text-xs font-black text-[#a8f3f8]"
                    >
                      Позвонить AI-агентом
                    </Link>
                  ) : null}

                  {getLeadString(scoutResult, ['website']) ? (
                    <a
                      href={getLeadString(scoutResult, ['website'])}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-bold text-white/62"
                    >
                      Открыть сайт ↗
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-[22px] border border-[#f1c96c]/13 bg-[#f1c96c]/[0.03] p-5">
            <p className="text-sm font-black text-[#f4d878]">Что потребуется подключить</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              httpSMS — Android-телефон и API key. Evolution Go — отдельный сервер/VPS,
              активированная лицензия, подключённый WhatsApp через QR и токен экземпляра.
              Scout — отдельный Python worker/API.
            </p>
            <Link
              href="/settings"
              className="mt-3 inline-flex rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-bold text-white/70 hover:border-[#69e4ee]/22 hover:text-white"
            >
              Интеграции →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProviderCard({
  name,
  provider,
  connected,
}: {
  name: string;
  provider: string;
  connected: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#fff8e7]">{name}</p>
          <p className="mt-0.5 text-[11px] text-white/44">{provider}</p>
        </div>
        <span
          className={
            connected
              ? 'rounded-full bg-emerald-300/[0.07] px-2 py-1 text-[9px] font-black text-emerald-200'
              : 'rounded-full bg-[#f1c96c]/[0.06] px-2 py-1 text-[9px] font-black text-[#f3d681]'
          }
        >
          {connected ? 'READY' : 'SETUP'}
        </span>
      </div>
    </div>
  );
}
