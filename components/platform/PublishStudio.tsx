'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { MediaUploadField } from '@/components/media/MediaUploadField';
import { FactoryChainBar } from '@/components/platform/FactoryChainBar';
import {
  getFactoryArtifactAction,
  getLatestFactoryArtifactAction,
} from '@/app/(dashboard)/modules/factory-chain/actions';

import {
  buildPublicationPackAction,
  getPublishingConnectionStatusAction,
  getTikTokCreatorInfoAction,
  publishVariantAction,
  type PublicationChannelId,
  type PublicationVariant,
  type PublishingConnectionStatus,
} from '@/app/(dashboard)/modules/publish/studio/actions';

const CHANNELS: Array<{
  id: PublicationChannelId;
  label: string;
  short: string;
  hint: string;
}> = [
  { id: 'telegram', label: 'Telegram', short: 'TG', hint: 'Пост для канала' },
  { id: 'vk', label: 'ВКонтакте', short: 'VK', hint: 'Лента и сообщество' },
  { id: 'dzen', label: 'Дзен', short: 'ДЗ', hint: 'Публикация / статья' },
  { id: 'youtube', label: 'YouTube', short: 'YT', hint: 'Видео / Shorts' },
  { id: 'instagram', label: 'Instagram Reels', short: 'IG', hint: 'Reels для профиля' },
  { id: 'tiktok', label: 'TikTok', short: 'TT', hint: 'Короткое видео' },
  { id: 'max', label: 'MAX', short: 'MX', hint: 'Канал / лента' },
];

function channelName(id: PublicationChannelId) {
  return CHANNELS.find((item) => item.id === id)?.label ?? id;
}

type PublishStudioProps = {
  initialProjectId?: string | null;
  initialArtifactId?: string | null;
};

export function PublishStudio({
  initialProjectId = null,
  initialArtifactId = null,
}: PublishStudioProps) {
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [source, setSource] = useState('');
  const [goal, setGoal] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [selected, setSelected] = useState<PublicationChannelId[]>([
    'telegram',
    'vk',
    'dzen',
  ]);
  const [variants, setVariants] = useState<PublicationVariant[]>([]);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState<PublicationChannelId | null>(null);
  const [connections, setConnections] = useState<PublishingConnectionStatus>({
    telegram: false,
    vk: false,
    dzen: false,
    youtube: false,
    instagram: false,
    tiktok: false,
    max: false,
  });
  const [publishingChannel, setPublishingChannel] = useState<PublicationChannelId | null>(null);
  const [handoffMessage, setHandoffMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaKind, setMediaKind] = useState<'image' | 'video' | 'audio' | null>(null);
  const [mediaName, setMediaName] = useState('');
  const [tiktokPrivacyLevel, setTikTokPrivacyLevel] = useState('SELF_ONLY');
  const [tiktokCreator, setTikTokCreator] = useState<{
    username: string;
    nickname: string;
    privacyLevels: string[];
    maxDurationSeconds: number | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const canBuild = source.trim().length > 3 && selected.length > 0 && !isPending;

  const selectedLabel = useMemo(
    () => selected.map(channelName).join(' · '),
    [selected],
  );

  useEffect(() => {
    void getPublishingConnectionStatusAction().then((nextConnections) => {
      setConnections(nextConnections);

      if (nextConnections.tiktok) {
        void getTikTokCreatorInfoAction().then((result) => {
          if (!result.ok) return;
          setTikTokCreator({
            username: result.creator.username,
            nickname: result.creator.nickname,
            privacyLevels: result.creator.privacyLevels,
            maxDurationSeconds: result.creator.maxDurationSeconds,
          });

          if (result.creator.privacyLevels.includes('SELF_ONLY')) {
            setTikTokPrivacyLevel('SELF_ONLY');
          } else if (result.creator.privacyLevels[0]) {
            setTikTokPrivacyLevel(result.creator.privacyLevels[0]);
          }
        });
      }
    });

    const handedOff = window.sessionStorage.getItem('business-zavod:publish-source');
    if (handedOff?.trim()) {
      const frame = window.requestAnimationFrame(() => {
        setSource(handedOff);
        setHandoffMessage('Материал из предыдущего цеха принят. Осталось выбрать площадки и собрать версии.');
        window.sessionStorage.removeItem('business-zavod:publish-source');
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (initialProjectId && initialArtifactId) {
      void getFactoryArtifactAction(initialProjectId, initialArtifactId).then((artifact) => {
        if (!artifact) return;
        setSource(artifact.content);
        setHandoffMessage('Выбранный результат проекта восстановлен. Можно продолжать публикацию.');
      });
      return;
    }

    if (initialProjectId) {
      void getLatestFactoryArtifactAction(initialProjectId).then((artifact) => {
        if (!artifact) return;
        setSource(artifact.content);
        setHandoffMessage('Последний результат проекта восстановлен. Можно продолжать публикацию.');
      });
    }
  }, [initialArtifactId, initialProjectId]);

  const toggleChannel = (id: PublicationChannelId) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const buildPack = () => {
    if (!canBuild) return;

    setMessage('');
    setCopied(null);

    startTransition(async () => {
      const result = await buildPublicationPackAction({
        source,
        channels: selected,
        goal,
        callToAction,
        projectId,
      });

      if (result.status === 'failed') {
        setMessage(result.message);
        return;
      }

      setProjectId(result.projectId);
      setVariants(result.variants);
      setMessage('Пакет готов. Тексты адаптированы отдельно под каждую площадку.');
    });
  };

  const publishVariant = async (variant: PublicationVariant) => {
    if (!connections[variant.channel] || publishingChannel) return;

    setPublishingChannel(variant.channel);
    setMessage('');

    const result = await publishVariantAction({
      channel: variant.channel,
      title: variant.title,
      body: variant.body,
      cta: variant.cta,
      projectId,
      mediaUrl:
        variant.channel === 'telegram' ||
        variant.channel === 'vk' ||
        variant.channel === 'youtube' ||
        variant.channel === 'instagram' ||
        variant.channel === 'tiktok'
          ? mediaUrl || null
          : null,
      mediaKind:
        variant.channel === 'telegram' ||
        variant.channel === 'vk' ||
        variant.channel === 'youtube' ||
        variant.channel === 'instagram' ||
        variant.channel === 'tiktok'
          ? mediaKind
          : null,
      tiktokPrivacyLevel:
        variant.channel === 'tiktok' ? tiktokPrivacyLevel : null,
    });

    setPublishingChannel(null);
    setMessage(result.message);
  };

  const copyVariant = async (variant: PublicationVariant) => {
    const text = [
      variant.title,
      variant.body,
      variant.cta,
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(variant.channel);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setMessage('Не удалось скопировать текст автоматически.');
    }
  };

  return (
    <main className="relative mx-auto w-full max-w-[1320px] overflow-hidden pb-16 text-[#f7f2e8]">
      <FactoryChainBar active="publish" />

      {projectId ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#69e4ee]/10 bg-[#69e4ee]/[0.025] px-4 py-3">
          <p className="text-sm text-white/64">Пакеты и публикации сохраняются в проект автоматически.</p>
          <a
            href={'/projects/' + projectId}
            className="text-xs font-black uppercase tracking-[.1em] text-[#79eaf2]"
          >
            Открыть проект →
          </a>
        </div>
      ) : null}

      {handoffMessage ? (
        <section className="mb-4 rounded-[20px] border border-emerald-300/12 bg-emerald-300/[0.04] px-4 py-3 text-sm font-semibold text-emerald-100/82">
          {handoffMessage}
        </section>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.12),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[26%] top-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.08),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 shadow-[0_28px_90px_-55px_rgba(0,0,0,.95)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative grid gap-7 xl:grid-cols-[1fr_.72fr] xl:items-end">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
              БИЗНЕС ЗАВОД · ЦЕХ ПУБЛИКАЦИИ
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(2.8rem,5vw,5.4rem)] font-black leading-[.94] tracking-[-.06em] text-[#fff8e7]">
              Один материал.
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                Несколько площадок.
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/74">
              OSA перепаковывает исходник под формат каждой площадки, сохраняя смысл и факты.
              Никакого одинакового текста во все каналы.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.035] p-5">
            <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
              МАРШРУТ
            </p>
            <p className="mt-2 text-xl font-black text-[#fff8e7]">
              Исходник → адаптация → проверка → выпуск
            </p>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Выбрано: {selectedLabel || 'площадки не выбраны'}
            </p>
          </div>
        </div>
      </section>

      <section className="relative mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
            ИСХОДНЫЙ МАТЕРИАЛ
          </p>

          <label className="mt-4 grid gap-2">
            <span className="text-base font-bold text-white/84">Что публикуем</span>
            <textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              rows={10}
              placeholder="Вставьте пост, статью, сценарий ролика, описание продукта или готовый материал…"
              className="resize-none rounded-[22px] border border-white/[0.09] bg-black/25 px-4 py-4 text-base leading-7 text-white outline-none placeholder:text-white/42 focus:border-[#69e4ee]/28"
            />
          </label>

          <div className="mt-4 rounded-[20px] border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white/82">Медиа к публикации · необязательно</p>
                <p className="mt-1 text-xs leading-5 text-white/48">
                  Фото, видео или аудио можно загрузить с устройства или выбрать из Медиатеки.
                  Telegram отправляет фото, видео и аудио. ВКонтакте прикрепляет изображение. YouTube, Instagram Reels и TikTok принимают выбранное видео после подключения канала.
                </p>
              </div>
              {mediaUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl('');
                    setMediaKind(null);
                    setMediaName('');
                  }}
                  className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-bold text-white/54"
                >
                  Убрать медиа
                </button>
              ) : null}
            </div>

            <div className="mt-3">
              <MediaUploadField
                accept="image/*,video/*,audio/*"
                projectId={projectId}
                autoCreateProject
                projectSeed="Публикация"
                onProjectReady={setProjectId}
                label="Загрузить медиа с устройства"
                onUploaded={({ url, kind, fileName }) => {
                  setMediaUrl(url);
                  setMediaKind(kind);
                  setMediaName(fileName);
                }}
              />
            </div>

            {mediaUrl ? (
              <div className="mt-3 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] px-3 py-2.5">
                <p className="truncate text-xs font-bold text-emerald-100/80">
                  {mediaName || 'Медиа выбрано'}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[.1em] text-emerald-200/55">
                  {mediaKind === 'image' ? 'Изображение' : mediaKind === 'video' ? 'Видео' : 'Аудио'}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/76">Цель · необязательно</span>
              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Заявка, просмотр, подписка…"
                className="rounded-2xl border border-white/[0.09] bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/38 focus:border-[#69e4ee]/28"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/76">CTA · необязательно</span>
              <input
                value={callToAction}
                onChange={(event) => setCallToAction(event.target.value)}
                placeholder="Напишите мне / оставьте заявку…"
                className="rounded-2xl border border-white/[0.09] bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/38 focus:border-[#69e4ee]/28"
              />
            </label>
          </div>

          <p className="mt-5 text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
            ПЛОЩАДКИ
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CHANNELS.map((channel) => {
              const active = selected.includes(channel.id);
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => toggleChannel(channel.id)}
                  className={[
                    'rounded-[18px] border p-3 text-left transition',
                    active
                      ? 'border-[#69e4ee]/34 bg-[#69e4ee]/[0.075]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15',
                  ].join(' ')}
                >
                  <span className="text-[11px] font-black tracking-[.12em] text-[#f1c96c]">
                    {channel.short}
                  </span>
                  <span className="mt-1 block text-sm font-black text-[#fff8e7]">
                    {channel.label}
                  </span>
                  <span className="mt-1 block text-[12px] text-white/58">
                    {channel.hint}
                  </span>
                  <span
                    className={[
                      'mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-bold',
                      connections[channel.id]
                        ? 'border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-200/88'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/42',
                    ].join(' ')}
                  >
                    {connections[channel.id] ? 'ПОДКЛЮЧЕНО' : 'НЕ ПОДКЛЮЧЕНО'}
                  </span>
                </button>
              );
            })}
          </div>

          {connections.tiktok ? (
            <div className="mt-4 rounded-[18px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.025] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white/82">TikTok аккаунт</p>
                  <p className="mt-1 text-xs text-white/52">
                    {tiktokCreator
                      ? (tiktokCreator.nickname || tiktokCreator.username || 'Подключённый аккаунт')
                      : 'Проверяю подключение…'}
                  </p>
                </div>
                {tiktokCreator?.maxDurationSeconds ? (
                  <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-bold text-white/48">
                    до {tiktokCreator.maxDurationSeconds} сек.
                  </span>
                ) : null}
              </div>

              {tiktokCreator?.privacyLevels.length ? (
                <label className="mt-3 grid gap-2">
                  <span className="text-xs font-bold text-white/62">Приватность публикации</span>
                  <select
                    value={tiktokPrivacyLevel}
                    onChange={(event) => setTikTokPrivacyLevel(event.target.value)}
                    className="rounded-xl border border-white/[0.09] bg-black/25 px-3 py-2.5 text-sm text-white outline-none"
                  >
                    {tiktokCreator.privacyLevels.map((level) => (
                      <option key={level} value={level}>
                        {level === 'PUBLIC_TO_EVERYONE'
                          ? 'Для всех'
                          : level === 'MUTUAL_FOLLOW_FRIENDS'
                            ? 'Взаимные подписки'
                            : level === 'FOLLOWER_OF_CREATOR'
                              ? 'Подписчики'
                              : level === 'SELF_ONLY'
                                ? 'Только я'
                                : level}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <p className="mt-3 text-[11px] leading-5 text-white/42">
                Нажатие «Опубликовать в TikTok» отправляет выбранный ролик в подключённый аккаунт.
                AI-видео помечается как сгенерированное искусственным интеллектом.
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={buildPack}
            disabled={!canBuild}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] shadow-[0_18px_40px_-22px_rgba(241,201,108,.6)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
          >
            {isPending ? 'OSA адаптирует публикации…' : 'Собрать пакет публикаций →'}
          </button>

          {message ? (
            <p className="mt-3 text-sm leading-6 text-white/66">{message}</p>
          ) : null}
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
                ВЫХОД ЛИНИИ
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                Готовые версии
              </h2>
            </div>
            <Link
              href="/settings"
              className="rounded-xl border border-white/[0.10] px-3 py-2 text-xs font-bold text-white/68 hover:border-[#69e4ee]/25 hover:text-white"
            >
              Подключить каналы
            </Link>
          </div>

          {variants.length === 0 ? (
            <div className="flex min-h-[520px] items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/[0.08] bg-white/[0.025] text-2xl text-[#79eaf2]">
                  ↑
                </div>
                <p className="mt-4 text-lg font-black text-white/76">
                  Здесь появятся версии под площадки
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/54">
                  Сначала добавьте исходник и выберите каналы. OSA адаптирует заголовок, текст и CTA отдельно для каждого.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {variants.map((variant) => (
                <article
                  key={variant.channel}
                  className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#79eaf2]">
                        {channelName(variant.channel)}
                      </p>
                      <h3 className="mt-2 text-lg font-black text-[#fff1bf]">
                        {variant.title || 'Без отдельного заголовка'}
                      </h3>
                    </div>
                    <span className="rounded-full border border-emerald-300/14 bg-emerald-300/[0.05] px-2.5 py-1 text-[10px] font-bold text-emerald-200/86">
                      ГОТОВО
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/78">
                    {variant.body}
                  </p>

                  {variant.cta ? (
                    <p className="mt-4 rounded-xl border border-[#f1c96c]/14 bg-[#f1c96c]/[0.035] px-3 py-2.5 text-sm font-bold text-[#f5d77c]">
                      CTA: {variant.cta}
                    </p>
                  ) : null}

                  {variant.notes ? (
                    <p className="mt-3 text-xs leading-5 text-white/48">
                      {variant.notes}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyVariant(variant)}
                      className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/72 hover:border-[#69e4ee]/24 hover:text-white"
                    >
                      {copied === variant.channel ? 'Скопировано ✓' : 'Скопировать'}
                    </button>

                    {connections[variant.channel] ? (
                      <button
                        type="button"
                        onClick={() => publishVariant(variant)}
                        disabled={Boolean(publishingChannel)}
                        className="rounded-xl bg-[linear-gradient(135deg,#69e4ee,#399fb5)] px-3 py-2 text-xs font-black text-[#041015] disabled:opacity-40"
                      >
                        {publishingChannel === variant.channel
                          ? 'Публикую…'
                          : `Опубликовать в ${channelName(variant.channel)}`}
                      </button>
                    ) : (
                      <Link
                        href="/settings"
                        className="rounded-xl border border-[#f1c96c]/14 bg-[#f1c96c]/[0.03] px-3 py-2 text-xs font-bold text-[#f5d77c]"
                      >
                        Подключить канал
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-white/[0.07] bg-white/[0.02] p-5">
        <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
          ПУБЛИКАЦИЯ
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
          Telegram, ВКонтакте, YouTube, Instagram Reels и TikTok публикуют напрямую после подключения доступа. Telegram отправляет фото, видео и аудио; ВКонтакте — текст и изображение; YouTube, Instagram Reels и TikTok — выбранный видеофайл. Прямая отправка доступна владельцу и администраторам организации. Дзен и MAX пока получают готовые версии на копирование — без имитации подключения.
        </p>
      </section>
    </main>
  );
}
