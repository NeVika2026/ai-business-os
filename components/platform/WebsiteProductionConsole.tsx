'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { generateWebsiteArtifactAction } from '@/app/(dashboard)/modules/create/studio/actions';
import { getFactoryArtifactAction } from '@/app/(dashboard)/modules/factory-chain/actions';

type WebsiteProductionConsoleProps = {
  goal: string;
  audience: string;
  format: string;
  context: string;
  projectId?: string | null;
  artifactId?: string | null;
};

function htmlFilename(title: string) {
  const safe = title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return (safe || 'landing') + '.html';
}

export function WebsiteProductionConsole({
  goal,
  audience,
  format,
  context,
  projectId = null,
  artifactId = null,
}: WebsiteProductionConsoleProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectId);
  const [html, setHtml] = useState('');
  const [title, setTitle] = useState('Готовый лендинг');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canBuild = goal.trim().length > 3 && !isPending;

  useEffect(() => {
    if (!projectId || !artifactId) return;

    void getFactoryArtifactAction(projectId, artifactId).then((artifact) => {
      if (!artifact) return;
      const modeId =
        typeof artifact.metadata.modeId === 'string' ? artifact.metadata.modeId : '';

      if (modeId !== 'site' && artifact.metadata.artifactType !== 'website_html') {
        return;
      }

      setHtml(artifact.content);
      setTitle(artifact.title.replace(/^Сайт\s*·\s*/i, '') || 'Готовый лендинг');
      setActiveProjectId(projectId);
      setMessage('Сохранённая версия сайта восстановлена из проекта.');
    });
  }, [artifactId, projectId]);

  const previewDocument = useMemo(() => html, [html]);

  const build = () => {
    if (!canBuild) return;

    setMessage('');
    setCopied(false);

    startTransition(async () => {
      const result = await generateWebsiteArtifactAction({
        goal,
        audience,
        format,
        context,
        projectId: activeProjectId,
      });

      if (result.status === 'failed') {
        setMessage(result.message);
        return;
      }

      setActiveProjectId(result.projectId);
      setHtml(result.html);
      setTitle(result.title);
      setMessage('Сайт собран и сохранён в проект.');
    });
  };

  const download = () => {
    if (!html) return;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = htmlFilename(title);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyHtml = async () => {
    if (!html) return;

    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setMessage('Не удалось скопировать HTML автоматически.');
    }
  };

  return (
    <section className="relative mt-5 overflow-hidden rounded-[30px] border border-[#69e4ee]/12 bg-[linear-gradient(145deg,#06090e,#0b1119)] p-5 text-white sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.09),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-[20%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.08),transparent_70%)]"
      />

      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
              WEBSITE FACTORY
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-[#fff8e7]">
              Настоящий HTML, а не макет текста
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-7 text-white/68">
              OSA собирает адаптивный одностраничный сайт. Результат можно открыть прямо здесь,
              скачать как <code className="text-[#f1c96c]">index.html</code> и продолжить редактирование.
            </p>
          </div>

          {activeProjectId ? (
            <Link
              href={'/projects/' + activeProjectId}
              className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-3.5 py-2.5 text-xs font-black text-white/70 hover:border-[#69e4ee]/24 hover:text-white"
            >
              Открыть проект →
            </Link>
          ) : null}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[.34fr_.66fr]">
          <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#f1c96c]">
              СБОРКА
            </p>

            <div className="mt-4 space-y-3">
              {[
                ['01', 'Оффер и структура'],
                ['02', 'Продающие тексты'],
                ['03', 'Дизайн и адаптив'],
                ['04', 'HTML + CSS'],
                ['05', 'Проверка'],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="flex items-center gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.02] px-3 py-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#69e4ee]/12 bg-[#69e4ee]/[0.04] text-[10px] font-black text-[#79eaf2]">
                    {number}
                  </span>
                  <span className="text-sm font-bold text-white/74">{label}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={build}
              disabled={!canBuild}
              className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] shadow-[0_18px_40px_-22px_rgba(241,201,108,.6)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {isPending ? 'OSA собирает сайт…' : html ? 'Собрать новую версию →' : 'Собрать сайт →'}
            </button>

            {message ? (
              <p className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-sm leading-6 text-white/66">
                {message}
              </p>
            ) : null}

            {html ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={download}
                  className="rounded-xl border border-[#f1c96c]/16 bg-[#f1c96c]/[0.035] px-3 py-2.5 text-xs font-black text-[#f4d878]"
                >
                  Скачать HTML
                </button>
                <button
                  type="button"
                  onClick={copyHtml}
                  className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2.5 text-xs font-bold text-white/72 hover:border-[#69e4ee]/24 hover:text-white"
                >
                  {copied ? 'Скопировано ✓' : 'Копировать код'}
                </button>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#0e1218]">
            <div className="flex items-center gap-2 border-b border-white/[0.07] bg-black/30 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f1c96c]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#69e4ee]/80" />
              <div className="ml-3 min-w-0 flex-1 truncate rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-[11px] text-white/42">
                {html ? title : 'Предпросмотр готового сайта'}
              </div>
            </div>

            {previewDocument ? (
              <iframe
                title="Предпросмотр сайта"
                sandbox=""
                srcDoc={previewDocument}
                className="h-[720px] w-full bg-white"
              />
            ) : (
              <div className="flex h-[720px] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(105,228,238,.05),transparent_42%),#080c12] p-8 text-center">
                <div>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.035] text-3xl text-[#79eaf2]">
                    ◈
                  </div>
                  <p className="mt-5 text-xl font-black text-[#fff8e7]">
                    Здесь появится настоящий сайт
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/54">
                    Опишите задачу выше и запустите сборку. Результат будет отрисован как полноценная веб-страница, а не как текстовый план.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {html ? (
          <p className="mt-4 text-xs leading-5 text-white/44">
            Форма внутри статического HTML визуально готова, но отправка заявок требует подключения
            backend/CRM. Скрипты в AI-сгенерированном HTML намеренно удаляются перед предпросмотром и экспортом.
          </p>
        ) : null}
      </div>
    </section>
  );
}
