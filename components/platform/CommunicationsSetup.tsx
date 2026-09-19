'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  getCommunicationsDiagnosticsAction,
  type CommunicationsDiagnostics,
} from '@/app/(dashboard)/modules/communicate/actions';

function badge(status: 'ok' | 'warn' | 'off') {
  if (status === 'ok') {
    return 'border-emerald-300/14 bg-emerald-300/[0.04] text-emerald-200';
  }
  if (status === 'warn') {
    return 'border-[#f1c96c]/14 bg-[#f1c96c]/[0.04] text-[#f4d878]';
  }
  return 'border-white/[0.08] bg-white/[0.02] text-white/42';
}

function stateLabel(value: boolean) {
  return value ? 'ГОТОВО' : 'НЕ НАСТРОЕНО';
}

export function CommunicationsSetup() {
  const [diagnostics, setDiagnostics] = useState<CommunicationsDiagnostics | null>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    void getCommunicationsDiagnosticsAction().then(setDiagnostics);
  }, []);

  const origin = useMemo(
    () => (typeof window === 'undefined' ? '' : window.location.origin),
    [],
  );

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(''), 1400);
  };

  const evolutionHealth =
    diagnostics?.evolution.health === 'connected'
      ? 'ok'
      : diagnostics?.evolution.health === 'not_configured'
        ? 'off'
        : 'warn';

  const scoutHealth =
    diagnostics?.scout.health === 'healthy'
      ? 'ok'
      : diagnostics?.scout.health === 'not_configured'
        ? 'off'
        : 'warn';

  return (
    <main className="relative mx-auto w-full max-w-[1320px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.12),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/modules/communicate/studio"
                className="text-sm font-bold text-white/50 hover:text-white"
              >
                ← Связаться
              </Link>
              <span className="text-white/18">/</span>
              <p className="text-[12px] font-black uppercase tracking-[.16em] text-[#79eaf2]">
                ДИАГНОСТИКА КАНАЛОВ
              </p>
            </div>

            <h1 className="mt-5 max-w-4xl text-[clamp(3rem,5vw,5.3rem)] font-black leading-[.92] tracking-[-.06em] text-[#fff8e7]">
              Видно, что
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                подключено реально.
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/68">
              Исходящие каналы, входящие webhooks и Scout проверяются отдельно. Никакого «подключено» только потому, что поле существует.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void getCommunicationsDiagnosticsAction().then(setDiagnostics)}
            className="rounded-[16px] border border-[#69e4ee]/16 bg-[#69e4ee]/[0.04] px-5 py-3 text-sm font-black text-[#bff8fb]"
          >
            Проверить снова
          </button>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <StatusCard
          title="WhatsApp"
          provider="Evolution Go"
          status={evolutionHealth}
          value={
            diagnostics?.evolution.health === 'connected'
              ? 'Подключён'
              : diagnostics?.evolution.health === 'disconnected'
                ? 'Нужна авторизация'
                : diagnostics?.evolution.health === 'unreachable'
                  ? 'Нет связи'
                  : 'Не настроен'
          }
          detail={diagnostics?.evolution.detail || 'Проверяю…'}
        />
        <StatusCard
          title="SMS"
          provider="httpSMS"
          status={diagnostics?.outbound.sms.connected ? 'ok' : 'off'}
          value={diagnostics?.outbound.sms.connected ? 'Готов к отправке' : 'Не настроен'}
          detail={
            diagnostics?.outbound.sms.connected
              ? 'API key и номер отправителя присутствуют.'
              : 'Нужны HTTPSMS_API_KEY и HTTPSMS_FROM_PHONE.'
          }
        />
        <StatusCard
          title="Поиск лидов"
          provider="Scout worker"
          status={scoutHealth}
          value={
            diagnostics?.scout.health === 'healthy'
              ? 'Работает'
              : diagnostics?.scout.health === 'unreachable'
                ? 'Нет связи'
                : 'Не настроен'
          }
          detail={diagnostics?.scout.detail || 'Проверяю…'}
        />
      </section>

      <section className="mt-5 rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
              ВХОДЯЩИЕ СООБЩЕНИЯ
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
              Webhook-адреса Бизнес-Завода
            </h2>
          </div>
          <span
            className={[
              'rounded-full border px-3 py-1.5 text-[10px] font-black',
              badge(diagnostics?.inbound.ready ? 'ok' : 'warn'),
            ].join(' ')}
          >
            {diagnostics?.inbound.ready ? 'ПРИЁМ ГОТОВ' : 'НУЖНА НАСТРОЙКА'}
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <WebhookCard
            title="WhatsApp · Evolution Go"
            ready={Boolean(diagnostics?.inbound.evolutionWebhookReady)}
            url={
              origin +
              (diagnostics?.inbound.webhookPaths.evolution ||
                '/api/webhooks/evolution-go')
            }
            secretName="EVOLUTION_GO_WEBHOOK_SECRET"
            copied={copied === 'evolution'}
            onCopy={() =>
              void copy(
                origin +
                  (diagnostics?.inbound.webhookPaths.evolution ||
                    '/api/webhooks/evolution-go'),
                'evolution',
              )
            }
          />
          <WebhookCard
            title="SMS · httpSMS"
            ready={Boolean(diagnostics?.inbound.httpsmsWebhookReady)}
            url={
              origin +
              (diagnostics?.inbound.webhookPaths.httpsms ||
                '/api/webhooks/httpsms')
            }
            secretName="HTTPSMS_WEBHOOK_SECRET"
            copied={copied === 'httpsms'}
            onCopy={() =>
              void copy(
                origin +
                  (diagnostics?.inbound.webhookPaths.httpsms ||
                    '/api/webhooks/httpsms'),
                'httpsms',
              )
            }
          />
        </div>

        <div className="mt-5 rounded-[18px] border border-[#f1c96c]/10 bg-[#f1c96c]/[0.025] p-4">
          <p className="text-[10px] font-black uppercase tracking-[.10em] text-[#f4d878]">
            КАК ПЕРЕДАВАТЬ СЕКРЕТ
          </p>
          <p className="mt-2 text-sm leading-6 text-white/56">
            Если провайдер умеет заголовки — передавайте секрет в
            <span className="font-bold text-white/76"> x-business-zavod-webhook-secret</span>.
            Если умеет только URL — добавьте
            <span className="font-bold text-white/76"> ?secret=ВАШ_СЕКРЕТ</span>.
            Сам секрет в интерфейсе не показывается.
          </p>
        </div>

        {diagnostics?.inbound.missing.length ? (
          <div className="mt-4 rounded-[18px] border border-red-300/10 bg-red-300/[0.025] p-4">
            <p className="text-[10px] font-black uppercase tracking-[.10em] text-red-200">
              НЕ ХВАТАЕТ ПЕРЕМЕННЫХ
            </p>
            <p className="mt-2 break-words text-sm leading-6 text-white/58">
              {diagnostics.inbound.missing.join(' · ')}
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[26px] border border-white/[0.08] bg-[#080c12] p-5">
          <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#f4d878]">
            EVOLUTION GO
          </p>
          <p className="mt-3 text-sm leading-6 text-white/56">
            В инстансе подписка должна включать <span className="font-bold text-white/76">messages.upsert</span>.
            Группы и status-сообщения Бизнес-Завод отбрасывает, чтобы в CRM попадали только прямые диалоги.
          </p>
        </div>

        <div className="rounded-[26px] border border-white/[0.08] bg-[#080c12] p-5">
          <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
            HTTP SMS
          </p>
          <p className="mt-3 text-sm leading-6 text-white/56">
            В httpSMS нужен webhook на событие <span className="font-bold text-white/76">message.phone.received</span>.
            Ответ с неизвестного номера попадёт во «Входящие» как новый контакт и не потеряется.
          </p>
        </div>
      </section>
    </main>
  );
}

function StatusCard({
  title,
  provider,
  status,
  value,
  detail,
}: {
  title: string;
  provider: string;
  status: 'ok' | 'warn' | 'off';
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[26px] border border-white/[0.08] bg-[#080c12] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[.10em] text-white/34">
          {provider}
        </p>
        <span className={['rounded-full border px-2.5 py-1 text-[9px] font-black', badge(status)].join(' ')}>
          {status === 'ok' ? 'OK' : status === 'warn' ? 'ВНИМАНИЕ' : 'OFF'}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-black text-[#fff8e7]">{title}</h3>
      <p className="mt-2 text-sm font-bold text-white/68">{value}</p>
      <p className="mt-3 text-xs leading-5 text-white/40">{detail}</p>
    </article>
  );
}

function WebhookCard({
  title,
  ready,
  url,
  secretName,
  copied,
  onCopy,
}: {
  title: string;
  ready: boolean;
  url: string;
  secretName: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <article className="rounded-[22px] border border-white/[0.07] bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-[#fff8e7]">{title}</h3>
        <span className={['rounded-full border px-2.5 py-1 text-[9px] font-black', badge(ready ? 'ok' : 'warn')].join(' ')}>
          {stateLabel(ready)}
        </span>
      </div>
      <p className="mt-3 break-all rounded-[13px] border border-white/[0.06] bg-black/25 px-3 py-2.5 font-mono text-[11px] leading-5 text-white/56">
        {url}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-white/34">
          секрет: <span className="font-bold text-white/52">{secretName}</span>
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] font-black text-white/58"
        >
          {copied ? 'Скопировано' : 'Копировать URL'}
        </button>
      </div>
    </article>
  );
}
