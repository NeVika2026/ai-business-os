'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { createCustomAvatarAction } from '@/app/(dashboard)/modules/create/studio/actions';

type Props = { projectId?: string | null };

const VOICES = [
  ['victoria','Victoria'],['clara','Clara'],['nina','Nina'],['emma','Emma'],
  ['maya','Maya'],['luna','Luna'],['vincent','Vincent'],['david','David'],
  ['roman','Roman'],['leo','Leo'],
] as const;

export function CustomAvatarStudio({ projectId = null }: Props) {
  const [name,setName] = useState('');
  const [referenceImage,setReferenceImage] = useState('');
  const [personality,setPersonality] = useState('Дружелюбный, уверенный и естественный ведущий.');
  const [voicePreset,setVoicePreset] = useState('victoria');
  const [approved,setApproved] = useState(false);
  const [rightsConfirmed,setRightsConfirmed] = useState(false);
  const [avatarId,setAvatarId] = useState('');
  const [avatarName,setAvatarName] = useState('');
  const [activeProjectId,setActiveProjectId] = useState<string|null>(projectId);
  const [message,setMessage] = useState('');
  const [isCreating,startTransition] = useTransition();

  const create = () => {
    if (!name.trim() || !referenceImage.trim() || !approved || !rightsConfirmed || isCreating) return;
    setMessage('');
    setAvatarId('');

    startTransition(async () => {
      const result = await createCustomAvatarAction({
        name,
        referenceImage,
        personality,
        voicePreset,
        approved,
        rightsConfirmed,
        projectId:activeProjectId,
      });

      if (result.status !== 'completed') {
        setMessage(result.message);
        return;
      }

      setAvatarId(result.avatarId);
      setAvatarName(result.avatarName);
      setActiveProjectId(result.projectId);
      setMessage('Аватар создан и сохранён в проект.');
    });
  };

  const useAvatarHref = avatarId
    ? '/modules/create/avatar?mode=text&customAvatar=' + encodeURIComponent(avatarId) +
      '&project=' + encodeURIComponent(activeProjectId ?? '')
    : '#';

  return (
    <main className="mx-auto w-full max-w-[1180px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[34px] border border-white/[0.09] bg-[#080c12] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#79eaf2]">БИЗНЕС-ЗАВОД · МОЙ АВАТАР</p>
        <h1 className="mt-3 text-[clamp(2.7rem,5vw,5rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Создать аватар
          <span className="block text-[#f1c96c]">из фотографии.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Один раз создайте постоянный AI-персонаж. Потом используйте его для текста, озвучки и аватарных видео.
        </p>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[.82fr_1.18fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/72">Имя аватара</span>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Например: Виктория"
              className="rounded-2xl border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white" />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/72">Фотография</span>
            <input value={referenceImage} onChange={e=>setReferenceImage(e.target.value)} placeholder="https://…jpg"
              className="rounded-2xl border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white" />
            <span className="text-xs leading-5 text-white/40">Лучше фронтальный портрет с хорошо видимым лицом.</span>
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/72">Характер</span>
            <textarea rows={4} value={personality} onChange={e=>setPersonality(e.target.value)}
              className="resize-none rounded-2xl border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm leading-6 text-white" />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/72">Голос по умолчанию</span>
            <select value={voicePreset} onChange={e=>setVoicePreset(e.target.value)}
              className="rounded-2xl border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white">
              {VOICES.map(([id,label])=><option key={id} value={id}>{label}</option>)}
            </select>
          </label>

          <label className="mt-5 flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
            <input type="checkbox" checked={rightsConfirmed} onChange={e=>setRightsConfirmed(e.target.checked)} className="mt-1 h-4 w-4" />
            <span className="text-sm leading-6 text-white/62">Подтверждаю, что имею право использовать это изображение человека.</span>
          </label>

          <label className="mt-3 flex gap-3 rounded-2xl border border-[#f1c96c]/13 bg-[#f1c96c]/[0.035] p-4">
            <input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)} className="mt-1 h-4 w-4" />
            <span className="text-sm leading-6 text-white/62">Подтверждаю создание постоянного AI-аватара внешним медиасервисом.</span>
          </label>

          <button onClick={create}
            disabled={!name.trim() || !referenceImage.trim() || !approved || !rightsConfirmed || isCreating}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] disabled:opacity-35">
            {isCreating ? 'Создаю аватар…' : 'Создать мой аватар →'}
          </button>

          {message ? <p className="mt-4 rounded-2xl border border-white/[0.07] px-4 py-3 text-sm text-white/66">{message}</p> : null}
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          {!avatarId ? (
            <div className="flex min-h-[520px] items-center justify-center text-center text-white/40">
              После создания здесь появится ID постоянного аватара и кнопка запуска.
            </div>
          ) : (
            <div className="flex min-h-[520px] flex-col justify-center">
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#79eaf2]">ГОТОВО</p>
              <h2 className="mt-3 text-3xl font-black text-[#fff8e7]">{avatarName}</h2>
              <p className="mt-4 text-sm text-white/50">ID аватара</p>
              <code className="mt-2 break-all rounded-2xl border border-white/[0.08] bg-black/30 p-4 text-sm text-[#bff7fa]">{avatarId}</code>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={useAvatarHref} className="rounded-xl bg-[#f1c96c] px-4 py-3 text-sm font-black text-[#1b1105]">
                  Сделать видео этим аватаром →
                </Link>
                {activeProjectId ? (
                  <Link href={'/projects/'+activeProjectId} className="rounded-xl border border-white/[0.09] px-4 py-3 text-sm font-black text-white/62">
                    Открыть проект
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
