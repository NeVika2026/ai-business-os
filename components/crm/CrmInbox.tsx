'use client';

import Link from 'next/link';

type InboxReply = {
  leadId: string;
  leadName: string;
  phone: string | null;
  projectId: string | null;
  channel: 'whatsapp' | 'sms';
  text: string;
  at: string;
};

type InboxFollowUp = {
  leadId: string;
  leadName: string;
  phone: string | null;
  projectId: string | null;
  dueAt: string;
  overdue: boolean;
};

type CrmInboxProps = {
  replies: InboxReply[];
  followUps: InboxFollowUp[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function CrmInbox({ replies, followUps }: CrmInboxProps) {
  const overdue = followUps.filter((item) => item.overdue);
  const upcoming = followUps.filter((item) => !item.overdue);

  return (
    <main className="relative mx-auto w-full max-w-[1380px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.10),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[18%] top-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.08),transparent_70%)] blur-3xl"
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
                ЦЕНТР РАБОТЫ С ЛИДАМИ
              </p>
            </div>
            <h1 className="mt-5 max-w-4xl text-[clamp(3rem,5vw,5.4rem)] font-black leading-[.92] tracking-[-.06em] text-[#fff8e7]">
              Что требует
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                внимания сейчас.
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/68">
              Ответы клиентов, просроченные касания и ближайшие follow-up — без ручного просмотра всей CRM.
            </p>
          </div>

          <Link
            href="/modules/communicate/studio"
            className="rounded-[16px] border border-[#69e4ee]/16 bg-[#69e4ee]/[0.04] px-5 py-3 text-sm font-black text-[#bff8fb]"
          >
            Найти нового лида →
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Metric label="Ждут ответа" value={replies.length} tone="green" />
          <Metric label="Просрочено" value={overdue.length} tone="gold" />
          <Metric label="Ближайшие" value={upcoming.length} tone="cyan" />
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.14em] text-emerald-200">
                ВХОДЯЩИЕ
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                Клиенты ждут ответа
              </h2>
            </div>
            <span className="rounded-full border border-emerald-300/12 bg-emerald-300/[0.03] px-3 py-1.5 text-[10px] font-black text-emerald-200">
              {replies.length}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {replies.length ? (
              replies.map((item) => {
                const communicationHref =
                  '/modules/communicate/studio?lead=' +
                  encodeURIComponent(item.leadId) +
                  '&channel=' +
                  item.channel +
                  (item.phone ? '&phone=' + encodeURIComponent(item.phone) : '') +
                  (item.projectId ? '&project=' + encodeURIComponent(item.projectId) : '');

                return (
                  <article
                    key={item.leadId}
                    className="rounded-[22px] border border-emerald-300/12 bg-emerald-300/[0.025] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[.10em] text-emerald-200/72">
                          {item.channel === 'sms' ? 'SMS' : 'WHATSAPP'} · НОВЫЙ ОТВЕТ
                        </p>
                        <Link
                          href={'/crm/' + encodeURIComponent(item.leadId)}
                          className="mt-1 block text-lg font-black text-[#fff8e7] hover:text-white"
                        >
                          {item.leadName}
                        </Link>
                      </div>
                      <time className="text-[10px] font-bold text-white/28">{formatDateTime(item.at)}</time>
                    </div>

                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/68">
                      {item.text || 'Получено новое сообщение.'}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href={communicationHref}
                        className="rounded-[14px] bg-[linear-gradient(135deg,#dfffb0,#83dfae)] px-3 py-2.5 text-center text-xs font-black text-[#0b2116]"
                      >
                        OSA ответить →
                      </Link>
                      <Link
                        href={'/crm/' + encodeURIComponent(item.leadId)}
                        className="rounded-[14px] border border-white/[0.08] px-3 py-2.5 text-center text-xs font-black text-white/62"
                      >
                        История
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <Empty text="Нет сообщений, которые ждут ответа." />
            )}
          </div>
        </div>

        <div className="grid content-start gap-5">
          <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#f4d878]">
                  ПРОСРОЧЕНО
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                  Надо связаться
                </h2>
              </div>
              <span className="rounded-full border border-[#f1c96c]/12 bg-[#f1c96c]/[0.03] px-3 py-1.5 text-[10px] font-black text-[#f4d878]">
                {overdue.length}
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {overdue.length ? (
                overdue.map((item) => (
                  <FollowUpCard key={item.leadId} item={item} overdue />
                ))
              ) : (
                <Empty text="Просроченных контактов нет." />
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
                  БЛИЖАЙШИЕ
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                  Следующие касания
                </h2>
              </div>
              <span className="rounded-full border border-[#69e4ee]/12 bg-[#69e4ee]/[0.03] px-3 py-1.5 text-[10px] font-black text-[#a8f3f8]">
                {upcoming.length}
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {upcoming.length ? (
                upcoming.slice(0, 12).map((item) => (
                  <FollowUpCard key={item.leadId} item={item} overdue={false} />
                ))
              ) : (
                <Empty text="Ближайшие контакты пока не назначены." />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'gold' | 'cyan';
}) {
  const toneClass =
    tone === 'green'
      ? 'border-emerald-300/12 bg-emerald-300/[0.03]'
      : tone === 'gold'
        ? 'border-[#f1c96c]/12 bg-[#f1c96c]/[0.03]'
        : 'border-[#69e4ee]/12 bg-[#69e4ee]/[0.03]';

  return (
    <div className={'rounded-[20px] border p-4 ' + toneClass}>
      <p className="text-[10px] font-black uppercase tracking-[.11em] text-white/38">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-[-.05em] text-[#fff8e7]">{value}</p>
    </div>
  );
}

function FollowUpCard({
  item,
  overdue,
}: {
  item: InboxFollowUp;
  overdue: boolean;
}) {
  const communicationHref =
    '/modules/communicate/studio?lead=' +
    encodeURIComponent(item.leadId) +
    '&channel=whatsapp' +
    (item.phone ? '&phone=' + encodeURIComponent(item.phone) : '') +
    (item.projectId ? '&project=' + encodeURIComponent(item.projectId) : '');

  return (
    <article
      className={[
        'rounded-[20px] border p-4',
        overdue
          ? 'border-[#f1c96c]/12 bg-[#f1c96c]/[0.025]'
          : 'border-white/[0.07] bg-white/[0.02]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={'/crm/' + encodeURIComponent(item.leadId)}
          className="text-sm font-black text-[#fff8e7] hover:text-white"
        >
          {item.leadName}
        </Link>
        <time className={overdue ? 'text-[10px] font-bold text-[#f4d878]' : 'text-[10px] font-bold text-white/34'}>
          {formatDateTime(item.dueAt)}
        </time>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={communicationHref}
          className="rounded-xl border border-[#69e4ee]/12 bg-[#69e4ee]/[0.035] px-3 py-2 text-center text-[10px] font-black text-[#a8f3f8]"
        >
          Написать
        </Link>
        <Link
          href={'/crm/' + encodeURIComponent(item.leadId)}
          className="rounded-xl border border-white/[0.07] px-3 py-2 text-center text-[10px] font-black text-white/52"
        >
          Карточка
        </Link>
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-white/[0.08] p-7 text-center text-sm leading-6 text-white/34">
      {text}
    </div>
  );
}
