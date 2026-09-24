'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  getMediaGenerationStatusAction,
  startAvatarVideoAction,
  type AvatarVideoMode,
  type MediaStudioStatusResult,
} from '@/app/(dashboard)/modules/create/studio/actions';
import { saveFactoryArtifactAction } from '@/app/(dashboard)/modules/factory-chain/actions';

type Props = { initialMode: AvatarVideoMode; projectId?: string | null };

const AVATARS = [
  ['influencer','Инфлюенсер'],
  ['human-resource','Бизнес-персонаж'],
  ['fashion-designer','Дизайнер'],
  ['cooking-teacher','Ведущий'],
  ['music-superstar','Музыкальный образ'],
  ['tennis-coach','Тренер'],
] as const;

const VOICES = [
  ['victoria','Victoria'],['clara','Clara'],['nina','Nina'],['emma','Emma'],
  ['maya','Maya'],['luna','Luna'],['vincent','Vincent'],['david','David'],
  ['roman','Roman'],['leo','Leo'],
] as const;

const pending = (): MediaStudioStatusResult => ({
  status:'pending', providerStatus:'pending', outputUrl:null, outputUrls:[], ephemeral:false,
});

export function AvatarVideoStudio({ initialMode, projectId = null }: Props) {
  const [mode,setMode] = useState<AvatarVideoMode>(initialMode);
  const [avatarPreset,setAvatarPreset] = useState('influencer');
  const [text,setText] = useState('');
  const [audioUrl,setAudioUrl] = useState('');
  const [voicePreset,setVoicePreset] = useState('victoria');
  const [approved,setApproved] = useState(false);
  const [activeProjectId,setActiveProjectId] = useState<string|null>(projectId);
  const [jobId,setJobId] = useState('');
  const [status,setStatus] = useState<MediaStudioStatusResult|null>(null);
  const [message,setMessage] = useState('');
  const [isStarting,startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const saved = useRef('');

  const busy = isStarting || status?.status === 'pending' || status?.status === 'running';

  useEffect(() => {
    if (!jobId || !status || status.status === 'completed' || status.status === 'failed') return;
    timer.current = setTimeout(async () => {
      const next = await getMediaGenerationStatusAction('video', jobId, activeProjectId);
      setStatus(next);
      if (next.status === 'failed') setMessage('Генерация завершилась с ошибкой: ' + next.providerStatus);
    }, 3500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [activeProjectId,jobId,status]);

  useEffect(() => {
    if (!activeProjectId || status?.status !== 'completed' || !status.outputUrl || saved.current === status.outputUrl) return;
    saved.current = status.outputUrl;
    void saveFactoryArtifactAction({
      projectId: activeProjectId,
      stage:'create',
      title: mode === 'text' ? 'AI-аватар' : 'Аватар с готовым аудио',
      content: status.outputUrl,
      metadata:{
        artifactType: mode === 'text' ? 'avatar-video' : 'avatar-audio-sync',
        provider:'runway',
        outputUrl:status.outputUrl,
        outputUrls:status.outputUrls,
        storagePath:status.storagePath ?? null,
        avatarPreset,
        voicePreset: mode === 'text' ? voicePreset : null,
        audioUrl: mode === 'audio' ? audioUrl : null,
      },
    });
  }, [activeProjectId,audioUrl,avatarPreset,mode,status,voicePreset]);

  const run = () => {
    if (!approved || busy) return;
    setMessage(''); setStatus(null); setJobId('');
    startTransition(async () => {
      const result = await startAvatarVideoAction({
        mode,
        avatarType:'preset',
        avatarPreset,
        text,
        audioUrl,
        voicePreset,
        approved,
        projectId:activeProjectId,
      });
      if (result.status !== 'started') { setMessage(result.message); return; }
      setActiveProjectId(result.projectId);
      setJobId(result.id);
      setStatus(pending());
      setMessage('Генерация запущена. Результат появится автоматически.');
    });
  };

  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[34px] border border-white/[0.09] bg-[#080c12] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#79eaf2]">БИЗНЕС-ЗАВОД · AI-АВАТАР</p>
        <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Персонаж говорит.<span className="block text-[#f1c96c]">Текстом или вашим аудио.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Создайте говорящего AI-персонажа по сценарию или синхронизируйте его с готовой аудиодорожкой.
        </p>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2">
            {([['text','Текст → аватар'],['audio','Аудио → аватар']] as const).map(([id,label]) => (
              <button key={id} onClick={() => { setMode(id); setStatus(null); setJobId(''); setApproved(false); }}
                className={`rounded-2xl border px-4 py-3 text-sm font-black ${mode===id?'border-[#69e4ee]/30 bg-[#69e4ee]/[0.07] text-[#c8fbff]':'border-white/[0.08] text-white/56'}`}>
                {label}
              </button>
            ))}
          </div>

          <label className="mt-5 grid gap-2">
            <span className="text-sm font-bold text-white/72">Персонаж</span>
            <select value={avatarPreset} onChange={e=>setAvatarPreset(e.target.value)}
              className="rounded-2xl border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white">
              {AVATARS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
            </select>
          </label>

          {mode === 'text' ? (
            <>
              <label className="mt-4 grid gap-2">
                <span className="text-sm font-bold text-white/72">Текст</span>
                <textarea rows={7} value={text} onChange={e=>setText(e.target.value)}
                  placeholder="Что должен сказать персонаж"
                  className="resize-none rounded-2xl border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm leading-6 text-white" />
              </label>
              <label className="mt-4 grid gap-2">
                <span className="text-sm font-bold text-white/72">Голос</span>
                <select value={voicePreset} onChange={e=>setVoicePreset(e.target.value)}
                  className="rounded-2xl border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white">
                  {VOICES.map(([id,label])=><option key={id} value={id}>{label}</option>)}
                </select>
              </label>
            </>
          ) : (
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-bold text-white/72">Ссылка на аудиодорожку</span>
              <input value={audioUrl} onChange={e=>setAudioUrl(e.target.value)} placeholder="https://…mp3"
                className="rounded-2xl border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white" />
            </label>
          )}

          <label className="mt-5 flex gap-3 rounded-2xl border border-[#f1c96c]/13 bg-[#f1c96c]/[0.035] p-4">
            <input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)} className="mt-1 h-4 w-4" />
            <span className="text-sm leading-6 text-white/62">Подтверждаю платную генерацию видео и возможное списание кредитов.</span>
          </label>

          <button onClick={run}
            disabled={!approved || busy || (mode==='text' ? !text.trim() : !audioUrl.trim())}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] disabled:opacity-35">
            {busy ? 'Создаю…' : mode==='text' ? 'Создать аватарное видео →' : 'Синхронизировать с аудио →'}
          </button>
          {message ? <p className="mt-4 rounded-2xl border border-white/[0.07] px-4 py-3 text-sm text-white/66">{message}</p> : null}
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-black tracking-[.14em] text-[#79eaf2]">РЕЗУЛЬТАТ</p><h2 className="mt-2 text-2xl font-black">Готовый аватар</h2></div>
            {activeProjectId ? <Link href={'/projects/'+activeProjectId} className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-black text-white/62">Проект →</Link> : null}
          </div>
          {!status ? (
            <div className="flex min-h-[560px] items-center justify-center text-white/40">Выберите персонажа и задайте речь.</div>
          ) : status.status==='completed' && status.outputUrl ? (
            <div className="mt-5">
              <video src={status.outputUrl} controls playsInline className="max-h-[650px] w-full rounded-[20px] bg-black object-contain" />
              <div className="mt-4 flex justify-between gap-3"><span className="text-xs font-black text-emerald-200/82">ГОТОВО</span><a href={status.outputUrl} target="_blank" rel="noreferrer" className="text-xs font-black text-[#a8f3f8]">Открыть видео ↗</a></div>
            </div>
          ) : status.status==='failed' ? (
            <div className="flex min-h-[560px] items-center justify-center text-red-100/70">Не удалось создать видео.</div>
          ) : (
            <div className="flex min-h-[560px] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#69e4ee]" /></div>
          )}
        </div>
      </section>
    </main>
  );
}
