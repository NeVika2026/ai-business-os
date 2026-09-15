'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';

import { getMediaUploadContextAction } from '@/app/(dashboard)/modules/create/studio/actions';
import { createClient } from '@/services/supabase/client';
import {
  renderStoryboardVideo,
  type FinalVideoExportScene,
} from '@/utils/media/browser-video-export';

type FinalVideoExportPanelProps = {
  title: string;
  scenes: FinalVideoExportScene[];
  voiceUrl?: string | null;
};

type ExportedFile = {
  blob: Blob;
  objectUrl: string;
  extension: 'mp4' | 'webm';
  mimeType: string;
  durationSeconds: number;
};

function safeFileName(value: string) {
  const normalized = value
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return normalized || 'business-zavod-video';
}

export function FinalVideoExportPanel({
  title,
  scenes,
  voiceUrl,
}: FinalVideoExportPanelProps) {
  const [exported, setExported] = useState<ExportedFile | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isExporting, startExport] = useTransition();
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    return () => {
      if (exported?.objectUrl) URL.revokeObjectURL(exported.objectUrl);
    };
  }, [exported]);

  const exportVideo = () => {
    if (scenes.length === 0 || isExporting) return;

    setError('');
    setSaved(false);

    startExport(async () => {
      try {
        const result = await renderStoryboardVideo({
          scenes,
          voiceUrl,
          width: 768,
          height: 1280,
          fps: 30,
        });

        if (exported?.objectUrl) URL.revokeObjectURL(exported.objectUrl);

        setExported({
          ...result,
          objectUrl: URL.createObjectURL(result.blob),
        });
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Не удалось собрать видео.');
      }
    });
  };

  const saveToLibrary = () => {
    if (!exported || isSaving) return;

    setError('');

    startSaving(async () => {
      try {
        const context = await getMediaUploadContextAction();
        if (!context) throw new Error('Не удалось определить организацию.');

        const supabase = createClient();
        const assetId = crypto.randomUUID();
        const storagePath =
          context.organizationId +
          '/generated/video/final-export-' +
          assetId +
          '.' +
          exported.extension;

        const { error: uploadError } = await supabase.storage
          .from('media-assets')
          .upload(storagePath, exported.blob, {
            contentType: exported.mimeType,
            cacheControl: '31536000',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { error: rowError } = await supabase.from('media_assets').insert({
          organization_id: context.organizationId,
          created_by: context.userId,
          kind: 'video',
          provider: 'browser-export',
          provider_asset_id: assetId,
          storage_bucket: 'media-assets',
          storage_path: storagePath,
          content_type: exported.mimeType,
          byte_size: exported.blob.size,
          duration_seconds: exported.durationSeconds,
          metadata: {
            title,
            source: 'storyboard-final-export',
            scenes: scenes.length,
            has_voice: Boolean(voiceUrl),
            format: exported.extension,
          },
        });

        if (rowError) throw rowError;

        setSaved(true);
      } catch (reason) {
        setError(
          reason instanceof Error ? reason.message : 'Не удалось сохранить видео в медиатеку.',
        );
      }
    });
  };

  return (
    <div className="mt-5 rounded-[22px] border border-[#e7b952]/12 bg-[linear-gradient(145deg,rgba(231,185,82,.045),rgba(88,219,232,.025))] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#e7b952]">
            Финальный экспорт
          </p>
          <h4 className="mt-2 text-lg font-semibold text-[#fff8e7]">
            Собрать один готовый видеофайл
          </h4>
          <p className="mt-2 max-w-2xl text-[11px] leading-5 text-white/36">
            Браузер склеит готовые сцены, наложит русские субтитры и добавит озвучку.
            MP4 используется, если его поддерживает браузер; иначе экспортируется WebM.
          </p>
        </div>

        <span className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[9px] text-white/30">
          {scenes.length} сцен
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={exportVideo}
          disabled={scenes.length === 0 || isExporting}
          className="rounded-[16px] bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-4 py-3 text-xs font-extrabold text-[#181006] disabled:opacity-30"
        >
          {isExporting ? 'Собираю финальный файл…' : exported ? 'Пересобрать видео' : 'Собрать финальное видео'}
        </button>

        <button
          type="button"
          onClick={saveToLibrary}
          disabled={!exported || isSaving || saved}
          className="rounded-[16px] border border-[#58dbe8]/20 bg-[#58dbe8]/[0.05] px-4 py-3 text-xs font-bold text-[#9debf2] disabled:opacity-30"
        >
          {isSaving ? 'Сохраняю…' : saved ? 'Сохранено в медиатеке' : 'Сохранить в медиатеку'}
        </button>
      </div>

      {exported ? (
        <div className="mt-4">
          <video
            src={exported.objectUrl}
            controls
            playsInline
            className="max-h-[480px] w-full rounded-[18px] bg-black object-contain"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] text-white/30">
              {exported.extension.toUpperCase()} · {(exported.blob.size / 1024 / 1024).toFixed(1)} МБ
            </span>
            <a
              href={exported.objectUrl}
              download={safeFileName(title) + '.' + exported.extension}
              className="text-[10px] font-semibold text-[#8ceaf2] hover:text-white"
            >
              Скачать файл ↓
            </a>
          </div>
        </div>
      ) : null}

      {saved ? (
        <p className="mt-3 text-[10px] text-emerald-200/70">
          Финальный файл сохранён. <Link href="/media" className="underline">Открыть медиатеку</Link>
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-red-300/10 bg-red-300/[0.04] px-3 py-2 text-[10px] leading-5 text-red-100/70">
          {error}
        </p>
      ) : null}
    </div>
  );
}
