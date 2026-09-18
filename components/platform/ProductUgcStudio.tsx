'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  getMediaGenerationStatusAction,
  startProductUgcAction,
  type MediaStudioStatusResult,
} from '@/app/(dashboard)/modules/create/studio/actions';
import { saveFactoryArtifactAction } from '@/app/(dashboard)/modules/factory-chain/actions';

type ProductUgcStudioProps = {
  projectId?: string | null;
};

export function ProductUgcStudio({ projectId = null }: ProductUgcStudioProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectId);
  const [characterImage, setCharacterImage] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productInfo, setProductInfo] = useState('');
  const [concept, setConcept] = useState('');
  const [duration, setDuration] = useState(15);
  const [approved, setApproved] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState<MediaStudioStatusResult | null>(null);
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
      const next = await getMediaGenerationStatusAction('video', jobId, activeProjectId);
      setJobStatus(next);

      if (next.status === 'failed') {
        setMessage('UGC-генерация завершилась с ошибкой: ' + next.providerStatus);
      }
    }, 3500);

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [activeProjectId, jobId, jobStatus]);

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
    void saveFactoryArtifactAction({
      projectId: activeProjectId,
      stage: 'create',
      title: 'AI UGC · готовый ролик',
      content: [
        productInfo.trim(),
        concept.trim(),
        jobStatus.outputUrl,
      ].filter(Boolean).join('\n\n'),
      metadata: {
        modeId: 'video',
        artifactType: 'product_ugc',
        provider: 'runway',
        outputUrl: jobStatus.outputUrl,
        storagePath: jobStatus.storagePath ?? null,
        providerStatus: jobStatus.providerStatus,
      },
    });
  }, [activeProjectId, concept, jobStatus, productInfo]);

  const start = () => {
    if (busy || !approved || !rightsConfirmed) return;

    setMessage('');
    setJobStatus(null);
    setJobId('');

    startTransition(async () => {
      const result = await startProductUgcAction({
        characterImage,
        productImage,
        productInfo,
        concept,
        duration,
        approved,
        projectId: activeProjectId,
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
      setMessage('UGC-ролик запущен. Проверяю готовность автоматически.');
    });
  };

  return (
    <main className="relative mx-auto w-full max-w-[1320px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-[430px] w-[430px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.11),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[18%] top-48 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.09),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative grid gap-7 xl:grid-cols-[1fr_.72fr] xl:items-end">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
              TREND LAB · PRODUCT UGC
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(3rem,5vw,5.4rem)] font-black leading-[.92] tracking-[-.065em] text-[#fff8e7]">
              Фото человека + товар
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                → готовая UGC-реклама.
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
              Бизнес-Завод передаёт персонажа, продукт и сценарную идею в Product UGC recipe.
              На выходе — готовый короткий рекламный ролик.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.035] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#79eaf2]">
              ДВИЖОК
            </p>
            <p className="mt-2 text-xl font-black text-[#fff8e7]">Runway · Product UGC</p>
            <p className="mt-2 text-sm leading-6 text-white/58">
              Реальная платная генерация. Для старта нужны публичные ссылки на фото персонажа и продукта.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mt-5 grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
            ВХОДНЫЕ МАТЕРИАЛЫ
          </p>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/76">Фото персонажа</span>
            <input
              value={characterImage}
              onChange={(event) => setCharacterImage(event.target.value)}
              placeholder="https://…"
              className="rounded-[18px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/34 focus:border-[#69e4ee]/28"
            />
            <span className="text-[11px] leading-5 text-white/44">
              Лицо должно быть хорошо видно, без сильных теней и перекрытий.
            </span>
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/76">Фото продукта</span>
            <input
              value={productImage}
              onChange={(event) => setProductImage(event.target.value)}
              placeholder="https://…"
              className="rounded-[18px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/34 focus:border-[#69e4ee]/28"
            />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/76">Что за продукт</span>
            <textarea
              rows={4}
              value={productInfo}
              onChange={(event) => setProductInfo(event.target.value)}
              placeholder="Что это, главная польза, ключевые особенности — только реальные факты."
              className="resize-none rounded-[18px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm leading-6 text-white outline-none placeholder:text-white/34 focus:border-[#69e4ee]/28"
            />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/76">Сценарий / концепция</span>
            <textarea
              rows={6}
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder="Например: нативный creator-style ролик, человек показывает продукт в руке, начинает с боли клиента, затем демонстрирует решение и заканчивает мягким CTA."
              className="resize-none rounded-[18px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm leading-6 text-white outline-none placeholder:text-white/34 focus:border-[#69e4ee]/28"
            />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/76">Длительность</span>
            <select
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="rounded-[18px] border border-white/[0.09] bg-[#0a0e15] px-4 py-3.5 text-sm text-white outline-none"
            >
              <option value={10}>10 секунд</option>
              <option value={15}>15 секунд</option>
              <option value={20}>20 секунд</option>
            </select>
          </label>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-4">
            <input
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(event) => setRightsConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm leading-6 text-white/62">
              У меня есть права и согласие на использование внешности человека и изображения продукта.
            </span>
          </label>

          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#f1c96c]/13 bg-[#f1c96c]/[0.035] p-4">
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
            disabled={
              busy ||
              !approved ||
              !rightsConfirmed ||
              !characterImage.trim() ||
              !productImage.trim() ||
              !productInfo.trim() ||
              !concept.trim()
            }
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] shadow-[0_18px_40px_-22px_rgba(241,201,108,.6)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy ? 'Собираю UGC-ролик…' : 'Создать UGC-рекламу →'}
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
              <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
                Готовый UGC-ролик
              </h2>
            </div>
            {activeProjectId ? (
              <Link
                href={'/projects/' + activeProjectId}
                className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-bold text-white/62 hover:border-[#69e4ee]/22 hover:text-white"
              >
                Проект →
              </Link>
            ) : null}
          </div>

          {!jobStatus ? (
            <div className="flex min-h-[650px] items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.035] text-3xl text-[#79eaf2]">
                  UGC
                </div>
                <p className="mt-5 text-xl font-black text-[#fff8e7]">Ролик появится здесь</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/52">
                  Персонаж, продукт и концепция объединяются в один короткий creator-style рекламный ролик.
                </p>
              </div>
            </div>
          ) : jobStatus.status === 'pending' || jobStatus.status === 'running' ? (
            <div className="flex min-h-[650px] items-center justify-center text-center">
              <div>
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#69e4ee]" />
                <p className="mt-4 text-base font-black text-[#dffbff]">
                  UGC-производство идёт
                </p>
                <p className="mt-2 text-sm text-white/52">
                  Статус проверяется автоматически.
                </p>
              </div>
            </div>
          ) : jobStatus.status === 'completed' && jobStatus.outputUrl ? (
            <div className="mt-5">
              <video
                className="max-h-[650px] w-full rounded-[20px] bg-black object-contain"
                controls
                playsInline
                src={jobStatus.outputUrl}
              />
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
                  Открыть файл ↗
                </a>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[650px] items-center justify-center text-center">
              <div>
                <p className="text-lg font-black text-red-100/82">UGC не собран</p>
                <p className="mt-2 text-sm text-white/52">{jobStatus.providerStatus}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
