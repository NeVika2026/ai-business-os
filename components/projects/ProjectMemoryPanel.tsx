'use client';

import { useState, useTransition } from 'react';

import { saveProjectMemoryAction } from '@/app/(dashboard)/projects/actions';
import type { ProjectMemory } from '@/lib/projects/project-memory';

type ProjectMemoryPanelProps = {
  projectId: string;
  initialMemory: ProjectMemory;
};

type MemoryField = Exclude<keyof ProjectMemory, 'updatedAt'>;

const FIELDS: Array<{
  id: MemoryField;
  label: string;
  placeholder: string;
}> = [
  {
    id: 'goals',
    label: 'Цели',
    placeholder: 'Что должно получиться и какой бизнес-результат нужен…',
  },
  {
    id: 'audience',
    label: 'Аудитория',
    placeholder: 'Кто клиент, что для него важно, чего он боится…',
  },
  {
    id: 'style',
    label: 'Стиль',
    placeholder: 'Тон, визуальный характер, подача, примеры…',
  },
  {
    id: 'decisions',
    label: 'Важные решения',
    placeholder: 'Что уже решили и не нужно обсуждать заново…',
  },
  {
    id: 'constraints',
    label: 'Не делать',
    placeholder: 'Запреты, ошибки, нежелательные формулировки и ограничения…',
  },
];

export function ProjectMemoryPanel({
  projectId,
  initialMemory,
}: ProjectMemoryPanelProps) {
  const [memory, setMemory] = useState(initialMemory);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const update = (field: MemoryField, value: string) => {
    setMemory((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  const save = () => {
    if (isPending) return;

    startTransition(async () => {
      const result = await saveProjectMemoryAction({
        projectId,
        goals: memory.goals,
        audience: memory.audience,
        style: memory.style,
        decisions: memory.decisions,
        constraints: memory.constraints,
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setMemory((current) => ({ ...current, updatedAt: result.updatedAt }));
      setMessage('Память проекта сохранена.');
    });
  };

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(145deg,#080c12,#0b1119)] p-5 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.08),transparent_70%)]"
      />

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
            ПАМЯТЬ ПРОЕКТА
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
            OSA должна помнить это всегда
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
            Здесь фиксируются цели, аудитория, стиль и принятые решения. Они остаются в проекте
            после закрытия браузера.
          </p>
        </div>

        <div className="text-right">
          <span className="block text-[11px] font-bold uppercase tracking-[.12em] text-white/38">
            {memory.updatedAt
              ? 'Обновлено ' + new Date(memory.updatedAt).toLocaleString('ru-RU')
              : 'Пока не заполнено'}
          </span>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {FIELDS.map((field) => (
          <label
            key={field.id}
            className="rounded-[20px] border border-white/[0.07] bg-black/20 p-4"
          >
            <span className="text-[12px] font-black uppercase tracking-[.1em] text-[#79eaf2]">
              {field.label}
            </span>
            <textarea
              value={memory[field.id]}
              onChange={(event) => update(field.id, event.target.value)}
              rows={6}
              placeholder={field.placeholder}
              className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-white/80 outline-none placeholder:text-white/30"
            />
          </label>
        ))}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-xl bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-4 py-2.5 text-xs font-black text-[#1b1105] transition hover:-translate-y-0.5 disabled:opacity-45"
        >
          {isPending ? 'Сохраняю…' : 'Сохранить память'}
        </button>
        {message ? (
          <p className="text-sm font-semibold text-white/62">{message}</p>
        ) : null}
      </div>
    </section>
  );
}
