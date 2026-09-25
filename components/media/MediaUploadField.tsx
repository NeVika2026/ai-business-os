'use client';

import { useRef, useState, useTransition } from 'react';

import {
  completeMediaUploadAction,
  listMediaPickerAction,
  prepareMediaUploadAction,
  type MediaPickerItem,
} from '@/app/(dashboard)/media/actions';
import { ensureMediaProjectAction } from '@/app/(dashboard)/modules/create/studio/actions';
import { createClient } from '@/services/supabase/client';

type MediaKind = 'image' | 'video' | 'audio';

type Props = {
  accept?: string;
  expectedKind?: MediaKind;
  projectId?: string | null;
  label?: string;
  compact?: boolean;
  autoCreateProject?: boolean;
  projectSeed?: string;
  onProjectReady?: (projectId: string) => void;
  onUploaded?: (result: {
    url: string;
    kind: MediaKind;
    path: string;
    assetId: string;
    fileName: string;
  }) => void;
};

export function MediaUploadField({
  accept = 'image/*,video/*,audio/*',
  expectedKind,
  projectId = null,
  label = 'Загрузить с устройства',
  compact = false,
  autoCreateProject = false,
  projectSeed = 'Медиа-проект',
  onProjectReady,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerItems, setPickerItems] = useState<MediaPickerItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const choose = () => inputRef.current?.click();

  const openPicker = () => {
    setPickerOpen(true);
    setPickerLoading(true);
    setMessage('');

    void listMediaPickerAction(expectedKind)
      .then((items) => setPickerItems(items))
      .finally(() => setPickerLoading(false));
  };

  const selectFromLibrary = (item: MediaPickerItem) => {
    setPickerOpen(false);
    setFileName(item.title);
    setMessage('Выбрано из Медиатеки.');
    onUploaded?.({
      url: item.url,
      kind: item.kind,
      path: '',
      assetId: item.id,
      fileName: item.title,
    });
  };

  const upload = (file: File | null) => {
    if (!file || isUploading) return;

    setFileName(file.name);
    setMessage('');

    startTransition(async () => {
      let resolvedProjectId = projectId;

      if (!resolvedProjectId && autoCreateProject) {
        const project = await ensureMediaProjectAction(projectSeed, null);
        resolvedProjectId = project.projectId;
        onProjectReady?.(project.projectId);
      }

      const prepared = await prepareMediaUploadAction({
        fileName: file.name,
        contentType: file.type,
        byteSize: file.size,
        projectId: resolvedProjectId,
      });

      if (prepared.status !== 'ready') {
        setMessage(prepared.message);
        return;
      }

      if (expectedKind && prepared.kind !== expectedKind) {
        setMessage(
          expectedKind === 'image'
            ? 'Нужно выбрать изображение.'
            : expectedKind === 'video'
              ? 'Нужно выбрать видео.'
              : 'Нужно выбрать аудиофайл.',
        );
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.storage
        .from('media-assets')
        .uploadToSignedUrl(prepared.path, prepared.token, file, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        setMessage('Не удалось загрузить файл.');
        return;
      }

      const completed = await completeMediaUploadAction({
        path: prepared.path,
        assetId: prepared.assetId,
        fileName: file.name,
        contentType: file.type,
        byteSize: file.size,
        kind: prepared.kind,
        projectId: prepared.projectId,
      });

      if (completed.status !== 'completed') {
        setMessage(completed.message);
        return;
      }

      setMessage('Файл загружен.');
      onUploaded?.({
        url: completed.url,
        kind: completed.kind,
        path: completed.path,
        assetId: completed.assetId,
        fileName: file.name,
      });
    });
  };

  return (
    <div className={compact ? '' : 'rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3'}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          upload(event.target.files?.[0] ?? null);
          event.currentTarget.value = '';
        }}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={choose}
          disabled={isUploading}
          className={[
            'w-full rounded-xl border border-[#58dbe8]/18 bg-[#58dbe8]/[0.045] px-4 py-3 text-sm font-black text-[#bff7fa] transition hover:bg-[#58dbe8]/[0.08] disabled:opacity-45',
            compact ? 'py-2.5 text-xs' : '',
          ].join(' ')}
        >
          {isUploading ? 'Загружаю…' : label}
        </button>
        <button
          type="button"
          onClick={openPicker}
          className={[
            'w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm font-black text-white/70 transition hover:border-[#f1c96c]/20 hover:text-[#fff8e7]',
            compact ? 'py-2.5 text-xs' : '',
          ].join(' ')}
        >
          Выбрать из Медиатеки
        </button>
      </div>
      {fileName || message ? (
        <div className="mt-2 text-[10px] leading-5 text-white/45">
          {fileName ? <span className="block truncate">{fileName}</span> : null}
          {message ? <span className="block text-[#8ceaf2]/70">{message}</span> : null}
        </div>
      ) : null}

      {pickerOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[82vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#080c12] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#79eaf2]">
                  МЕДИАТЕКА
                </p>
                <h3 className="mt-1 text-xl font-black text-[#fff8e7]">Выберите исходник</h3>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-black text-white/60"
              >
                Закрыть
              </button>
            </div>

            <div className="max-h-[66vh] overflow-y-auto p-5">
              {pickerLoading ? (
                <div className="py-16 text-center text-sm text-white/40">Загружаю Медиатеку…</div>
              ) : pickerItems.length === 0 ? (
                <div className="py-16 text-center text-sm text-white/40">
                  Подходящих файлов пока нет.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pickerItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectFromLibrary(item)}
                      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] text-left transition hover:border-[#69e4ee]/25"
                    >
                      <div className="aspect-[16/10] bg-black/35">
                        {item.kind === 'image' ? (
                          <img src={item.url} alt="" className="h-full w-full object-cover" />
                        ) : item.kind === 'video' ? (
                          <video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl text-[#f1c96c]">♪</div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-bold text-[#fff8e7]">{item.title}</p>
                        <p className="mt-1 text-[10px] text-white/35">
                          {item.kind === 'image' ? 'Изображение' : item.kind === 'video' ? 'Видео' : 'Аудио'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
