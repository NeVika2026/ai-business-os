'use client';

import { useRef, useState, useTransition } from 'react';

import {
  completeMediaUploadAction,
  prepareMediaUploadAction,
} from '@/app/(dashboard)/media/actions';
import { createClient } from '@/services/supabase/client';

type MediaKind = 'image' | 'video' | 'audio';

type Props = {
  accept?: string;
  expectedKind?: MediaKind;
  projectId?: string | null;
  label?: string;
  compact?: boolean;
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
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, startTransition] = useTransition();

  const choose = () => inputRef.current?.click();

  const upload = (file: File | null) => {
    if (!file || isUploading) return;

    setFileName(file.name);
    setMessage('');

    startTransition(async () => {
      const prepared = await prepareMediaUploadAction({
        fileName: file.name,
        contentType: file.type,
        byteSize: file.size,
        projectId,
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
      {fileName || message ? (
        <div className="mt-2 text-[10px] leading-5 text-white/45">
          {fileName ? <span className="block truncate">{fileName}</span> : null}
          {message ? <span className="block text-[#8ceaf2]/70">{message}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
