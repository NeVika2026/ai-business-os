'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  getMediaGenerationStatusAction,
  startCampaignRecipeAction,
  type CampaignRecipeKind,
  type MediaStudioStatusResult,
} from '@/app/(dashboard)/modules/create/studio/actions';
import { saveFactoryArtifactAction } from '@/app/(dashboard)/modules/factory-chain/actions';

type CampaignFactoryStudioProps = {
  projectId?: string | null;
  initialKind?: CampaignRecipeKind;
};

const TABS: Array<{
  id: CampaignRecipeKind;
  label: string;
  description: string;
  mediaKind: 'video' | 'image';
}> = [
  {
    id: 'product_ad',
    label: 'Product Ad',
    description: 'Фото товара → cinematic-реклама',
    mediaKind: 'video',
  },
  {
    id: 'product_ugc',
    label: 'Product UGC',
    description: 'Персонаж + товар → UGC-реклама',
    mediaKind: 'video',
  },
  {
    id: 'product_campaign',
    label: 'Campaign Images',
    description: 'Фото товара → 4 campaign-визуала',
    mediaKind: 'image',
  },
  {
    id: 'ad_localization',
    label: 'Localization',
    description: 'Креатив → другой язык',
    mediaKind: 'image',
  },
  {
    id: 'multi_shot',
    label: 'Multi-shot',
    description: 'Несколько сцен → один ролик',
    mediaKind: 'video',
  },
];

const LANGUAGES = [
  ['en', 'Английский'],
  ['es', 'Испанский'],
  ['de', 'Немецкий'],
  ['fr', 'Французский'],
  ['it', 'Итальянский'],
  ['pt', 'Португальский'],
  ['zh', 'Китайский'],
  ['ja', 'Японский'],
  ['ko', 'Корейский'],
  ['ar', 'Арабский'],
] as const;

export function CampaignFactoryStudio({
  projectId = null,
  initialKind = 'product_ad',
}: CampaignFactoryStudioProps) {
  const [kind, setKind] = useState<CampaignRecipeKind>(initialKind);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectId);
  const [productImagesText, setProductImagesText] = useState('');
  const [productInfo, setProductInfo] = useState('');
  const [concept, setConcept] = useState('');
  const [characterImage, setCharacterImage] = useState('');
  const [productImage, setProductImage] = useState('');
  const [duration, setDuration] = useState(10);
  const [referenceImage, setReferenceImage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [campaignImage, setCampaignImage] = useState('');
  const [campaignPrompt, setCampaignPrompt] = useState('');
  const [shots, setShots] = useState([
    { prompt: '', duration: 3 },
    { prompt: '', duration: 3 },
    { prompt: '', duration: 4 },
  ]);
  const [approved, setApproved] = useState(false);
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState<MediaStudioStatusResult | null>(null);
  const mediaKind = TABS.find((tab) => tab.id === kind)?.mediaKind ?? 'video';
  const [message, setMessage] = useState('');
  const [isStarting, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef('');

  const busy =
    isStarting ||
    jobStatus?.status === 'pending' ||
    jobStatus?.status === 'running';

  useEffect(() => {
    if (!jobId || !jobStatus) return;
    if (jobStatus.status === 'completed' || jobStatus.status === 'failed') return;

    pollRef.current = setTimeout(async () => {
      const next = await getMediaGenerationStatusAction(mediaKind, jobId, activeProjectId);
      setJobStatus(next);

      if (next.status === 'failed') {
        setMessage('Генерация завершилась с ошибкой: ' + next.providerStatus);
      }
    }, 3500);

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [activeProjectId, jobId, jobStatus, mediaKind]);

  useEffect(() => {
    if (
      !activeProjectId ||
      jobStatus?.status !== 'completed' ||
      !jobStatus.outputUrl ||
      savedRef.current === jobStatus.outputUrl
    ) {
      return;
    }

    savedRef.current = jobStatus.outputUrl;

    const title =
      kind === 'product_ad'
        ? 'Product Ad · готовый ролик'
        : kind === 'product_ugc'
          ? 'Product UGC · готовый ролик'
          : kind === 'product_campaign'
          ? 'Product Campaign · визуалы'
          : kind === 'ad_localization'
            ? 'Локализованный креатив'
            : 'Multi-shot · готовый ролик';

    void saveFactoryArtifactAction({
      projectId: activeProjectId,
      stage: 'create',
      title,
      content: jobStatus.outputUrls.join('\n') || jobStatus.outputUrl,
      metadata: {
        artifactType: kind,
        provider: 'runway',
        outputUrl: jobStatus.outputUrl,
        outputUrls: jobStatus.outputUrls,
        storagePath: jobStatus.storagePath ?? null,
        providerStatus: jobStatus.providerStatus,
      },
    });
  }, [activeProjectId, jobStatus, kind]);

  const selectKind = (nextKind: CampaignRecipeKind) => {
    setKind(nextKind);
    setJobId('');
    setJobStatus(null);
    setMessage('');
    setApproved(false);
  };

  const canStart = (() => {
    if (!approved || busy) return false;
    if (kind === 'product_ad') {
      return Boolean(productImagesText.trim() && productInfo.trim() && concept.trim());
    }
    if (kind === 'product_ugc') {
      return Boolean(
        characterImage.trim() &&
        productImage.trim() &&
        productInfo.trim() &&
        concept.trim(),
      );
    }
    if (kind === 'product_campaign') {
      return Boolean(campaignImage.trim() && campaignPrompt.trim());
    }
    if (kind === 'ad_localization') {
      return Boolean(referenceImage.trim() && targetLanguage.trim());
    }
    return shots.filter((shot) => shot.prompt.trim()).length >= 2;
  })();

  const start = () => {
    if (!canStart) return;

    setMessage('');
    setJobId('');
    setJobStatus(null);

    startTransition(async () => {
      const result = await startCampaignRecipeAction({
        kind,
        approved,
        projectId: activeProjectId,
        productImages: productImagesText
          .split(/\n+/)
          .map((item) => item.trim())
          .filter(Boolean),
        characterImage,
        productImage,
        productInfo,
        concept,
        duration,
        referenceImage,
        targetLanguage,
        image: campaignImage,
        prompt: campaignPrompt,
        shots,
      });

      if (result.status !== 'started') {
        setMessage(result.message);
        return;
      }

      setActiveProjectId(result.projectId);
      setJobId(result.id);
      setJobStatus({
        status: 'pending',
        providerStatus: 'pending',
        outputUrl: null,
        outputUrls: [],
        ephemeral: false,
      });
      setMessage('Задача запущена. Проверяю готовность автоматически.');
    });
  };

  return (
    <main className="relative mx-auto w-full max-w-[1320px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-[430px] w-[430px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.11),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative">
          <p className="text-[13px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
            TREND LAB · CAMPAIGN FACTORY
          </p>
          <h1 className="mt-4 max-w-5xl text-[clamp(3rem,5vw,5.5rem)] font-black leading-[.92] tracking-[-.065em] text-[#fff8e7]">
            Товар → кампания
            <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
              без съёмочной команды.
            </span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
            Product Ad, campaign-визуалы, локализация рекламы и multi-shot видео работают через
            готовые производственные Recipes, а не через текстовые заглушки.
          </p>
        </div>
      </section>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => selectKind(tab.id)}
            className={[
              'rounded-[20px] border p-4 text-left transition',
              kind === tab.id
                ? 'border-[#69e4ee]/30 bg-[#69e4ee]/[0.06]'
                : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15',
            ].join(' ')}
          >
            <p className="text-sm font-black text-[#fff8e7]">{tab.label}</p>
            <p className="mt-1 text-xs leading-5 text-white/52">{tab.description}</p>
          </button>
        ))}
      </div>

      <section className="relative mt-5 grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
            НАСТРОЙКА
          </p>

          {kind === 'product_ad' ? (
            <>
              <Field label="Фото продукта · по одной ссылке на строку">
                <textarea
                  rows={4}
                  value={productImagesText}
                  onChange={(event) => setProductImagesText(event.target.value)}
                  placeholder={'https://…/front.jpg\nhttps://…/side.jpg'}
                />
              </Field>
              <Field label="Что за продукт">
                <textarea
                  rows={4}
                  value={productInfo}
                  onChange={(event) => setProductInfo(event.target.value)}
                  placeholder="Только реальные характеристики и польза продукта."
                />
              </Field>
              <Field label="Креативная концепция">
                <textarea
                  rows={5}
                  value={concept}
                  onChange={(event) => setConcept(event.target.value)}
                  placeholder="Например: премиальная летняя кампания, медленный dolly, капли воды, hero-shot в финале."
                />
              </Field>
              <Field label="Длительность">
                <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
                  <option value={5}>5 секунд</option>
                  <option value={10}>10 секунд</option>
                  <option value={15}>15 секунд</option>
                </select>
              </Field>
            </>
          ) : null}

          {kind === 'product_ugc' ? (
            <>
              <Field label="Фото персонажа">
                <input
                  value={characterImage}
                  onChange={(event) => setCharacterImage(event.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Фото продукта">
                <input
                  value={productImage}
                  onChange={(event) => setProductImage(event.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Что за продукт">
                <textarea
                  rows={4}
                  value={productInfo}
                  onChange={(event) => setProductInfo(event.target.value)}
                  placeholder="Что продаём, реальные свойства и польза."
                />
              </Field>
              <Field label="UGC-концепция">
                <textarea
                  rows={6}
                  value={concept}
                  onChange={(event) => setConcept(event.target.value)}
                  placeholder="Например: живая домашняя рекомендация, человек показывает продукт в кадре и коротко объясняет, зачем он нужен."
                />
              </Field>
              <Field label="Длительность">
                <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
                  <option value={10}>10 секунд</option>
                  <option value={15}>15 секунд</option>
                  <option value={20}>20 секунд</option>
                  <option value={30}>30 секунд</option>
                </select>
              </Field>
            </>
          ) : null}

          {kind === 'product_campaign' ? (
            <>
              <Field label="Фото продукта">
                <input
                  value={campaignImage}
                  onChange={(event) => setCampaignImage(event.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Креативный бриф">
                <textarea
                  rows={7}
                  value={campaignPrompt}
                  onChange={(event) => setCampaignPrompt(event.target.value)}
                  placeholder="Опишите стиль, свет, настроение, окружение и рекламную подачу."
                />
              </Field>
            </>
          ) : null}

          {kind === 'ad_localization' ? (
            <>
              <Field label="Исходный рекламный креатив">
                <input
                  value={referenceImage}
                  onChange={(event) => setReferenceImage(event.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Язык">
                <select
                  value={targetLanguage}
                  onChange={(event) => setTargetLanguage(event.target.value)}
                >
                  {LANGUAGES.map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="mt-3 text-sm leading-6 text-white/52">
                Макет и визуальная идея сохраняются, а текст на изображении адаптируется под выбранный язык.
              </p>
            </>
          ) : null}

          {kind === 'multi_shot' ? (
            <>
              <p className="mt-4 text-sm leading-6 text-white/58">
                Задайте 2–8 связанных сцен. Общая длительность ограничена производственным Recipe.
              </p>
              <div className="mt-4 grid gap-3">
                {shots.map((shot, index) => (
                  <div
                    key={index}
                    className="rounded-[18px] border border-white/[0.07] bg-black/20 p-3"
                  >
                    <p className="text-[11px] font-black text-[#79eaf2]">SHOT {index + 1}</p>
                    <textarea
                      rows={3}
                      value={shot.prompt}
                      onChange={(event) =>
                        setShots((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, prompt: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Опишите действие, камеру и объект в сцене."
                      className="mt-2 w-full resize-none bg-transparent text-sm leading-6 text-white/78 outline-none placeholder:text-white/28"
                    />
                    <select
                      value={shot.duration}
                      onChange={(event) =>
                        setShots((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, duration: Number(event.target.value) }
                              : item,
                          ),
                        )
                      }
                      className="mt-2 rounded-xl border border-white/[0.08] bg-[#0a0e15] px-3 py-2 text-xs text-white"
                    >
                      <option value={2}>2 сек</option>
                      <option value={3}>3 сек</option>
                      <option value={4}>4 сек</option>
                      <option value={5}>5 сек</option>
                    </select>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setShots((current) =>
                    current.length < 8 ? [...current, { prompt: '', duration: 3 }] : current,
                  )
                }
                className="mt-3 rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-bold text-white/62"
              >
                + Добавить сцену
              </button>
            </>
          ) : null}

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#f1c96c]/13 bg-[#f1c96c]/[0.035] p-4">
            <input
              type="checkbox"
              checked={approved}
              onChange={(event) => setApproved(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm leading-6 text-white/62">
              Подтверждаю запуск платной генерации и возможное списание кредитов.
            </span>
          </label>

          <button
            type="button"
            onClick={start}
            disabled={!canStart}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy ? 'Производство идёт…' : 'Запустить производство →'}
          </button>

          {message ? (
            <p className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/66">
              {message}
            </p>
          ) : null}
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
                ВЫХОД ЛИНИИ
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">
                Готовый результат
              </h2>
            </div>
            {activeProjectId ? (
              <Link
                href={'/projects/' + activeProjectId}
                className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-bold text-white/62"
              >
                Проект →
              </Link>
            ) : null}
          </div>

          {!jobStatus ? (
            <EmptyOutput />
          ) : jobStatus.status === 'pending' || jobStatus.status === 'running' ? (
            <div className="flex min-h-[620px] items-center justify-center text-center">
              <div>
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#69e4ee]" />
                <p className="mt-4 text-base font-black text-[#dffbff]">Производство идёт</p>
              </div>
            </div>
          ) : jobStatus.status === 'completed' && jobStatus.outputUrl ? (
            <div className="mt-5">
              {mediaKind === 'video' ? (
                <video
                  className="max-h-[650px] w-full rounded-[20px] bg-black object-contain"
                  controls
                  playsInline
                  src={jobStatus.outputUrl}
                />
              ) : jobStatus.outputUrls.length > 1 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {jobStatus.outputUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt="Результат кампании"
                      className="w-full rounded-[18px] bg-black object-contain"
                    />
                  ))}
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={jobStatus.outputUrl}
                  alt="Результат кампании"
                  className="max-h-[650px] w-full rounded-[20px] bg-black object-contain"
                />
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold text-emerald-200/84">
                  ГОТОВО · {jobStatus.providerStatus}
                </p>
                <a
                  href={jobStatus.outputUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-[#69e4ee]/16 px-3 py-2 text-xs font-black text-[#a8f3f8]"
                >
                  Открыть результат ↗
                </a>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[620px] items-center justify-center text-center">
              <div>
                <p className="text-lg font-black text-red-100/82">Не удалось собрать результат</p>
                <p className="mt-2 text-sm text-white/52">{jobStatus.providerStatus}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <label className="mt-4 grid gap-2">
      <span className="text-sm font-bold text-white/76">{label}</span>
      <div className="[&>input]:w-full [&>input]:rounded-[18px] [&>input]:border [&>input]:border-white/[0.09] [&>input]:bg-black/25 [&>input]:px-4 [&>input]:py-3.5 [&>input]:text-sm [&>input]:text-white [&>input]:outline-none [&>textarea]:w-full [&>textarea]:resize-none [&>textarea]:rounded-[18px] [&>textarea]:border [&>textarea]:border-white/[0.09] [&>textarea]:bg-black/25 [&>textarea]:px-4 [&>textarea]:py-3.5 [&>textarea]:text-sm [&>textarea]:leading-6 [&>textarea]:text-white [&>textarea]:outline-none [&>select]:w-full [&>select]:rounded-[18px] [&>select]:border [&>select]:border-white/[0.09] [&>select]:bg-[#0a0e15] [&>select]:px-4 [&>select]:py-3.5 [&>select]:text-sm [&>select]:text-white">
        {children}
      </div>
    </label>
  );
}

function EmptyOutput() {
  return (
    <div className="flex min-h-[620px] items-center justify-center text-center">
      <div>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.035] text-2xl font-black text-[#79eaf2]">
          ADS
        </div>
        <p className="mt-5 text-xl font-black text-[#fff8e7]">Кампания появится здесь</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/52">
          Выберите производственную механику слева и запустите генерацию.
        </p>
      </div>
    </div>
  );
}
