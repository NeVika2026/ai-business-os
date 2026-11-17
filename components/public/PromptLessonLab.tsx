'use client';

import { useState } from 'react';

type PromptFields = {
  role: string;
  task: string;
  audience: string;
  format: string;
};

export function buildFirstLessonPrompt(fields: PromptFields): string {
  const role = fields.role.trim().slice(0, 140);
  const task = fields.task.trim().slice(0, 280);
  const audience = fields.audience.trim().slice(0, 180);
  const format = fields.format.trim().slice(0, 180);

  if (!role || !task || !audience || !format) return '';

  return `Ты — ${role}.

Задача: ${task}

Целевая аудитория: ${audience}

Формат результата: ${format}

Требования:
1. Пиши на русском языке, понятно и без канцелярита.
2. Не придумывай факты, цены, сроки и гарантии. Если данных не хватает, отметь, что нужно уточнить.
3. Дай конкретный и применимый результат, без общих рассуждений.
4. Перед ответом проверь, что результат соответствует задаче и формату.

Если для качественного выполнения не хватает важных сведений, сначала задай до трёх уточняющих вопросов.`;
}

const initialFields: PromptFields = {
  role: 'опытный маркетолог для малого бизнеса',
  task: 'составь короткий продающий пост о консультации по выбору недвижимости',
  audience: 'люди, которые выбирают квартиру для себя',
  format: 'заголовок, два коротких абзаца и призыв к действию',
};

export function PromptLessonLab() {
  const [fields, setFields] = useState<PromptFields>(initialFields);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);

  function changeField(key: keyof PromptFields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setOutput('');
    setCopied(false);
    setCompleted(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const fieldsConfig: { name: keyof PromptFields; title: string; helper: string }[] = [
    { name: 'role', title: '1. Роль', helper: 'Кем должна быть нейросеть?' },
    { name: 'task', title: '2. Задача', helper: 'Что именно нужно сделать?' },
    { name: 'audience', title: '3. Контекст', helper: 'Для кого предназначен результат?' },
    { name: 'format', title: '4. Формат', helper: 'В каком виде нужен ответ?' },
  ];

  return (
    <section
      className="mt-8 rounded-[2rem] border border-[#e7d5c9] bg-white p-5 shadow-sm md:p-9"
      aria-label="Практическое задание"
    >
      <p className="text-xs font-black uppercase tracking-widest text-[#a14c13]">
        Задание · бесплатный пробный урок
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
        Соберите свой первый рабочий запрос
      </h2>
      <p className="mt-3 max-w-3xl leading-7 text-[#5b606b]">
        Хорошая инструкция для ИИ отвечает на четыре вопроса: кто выполняет задачу, что нужно
        сделать, для кого и в каком формате. Измените пример под свою работу.
      </p>
      <form
        className="mt-8 grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setOutput(buildFirstLessonPrompt(fields));
          setCopied(false);
          setCompleted(false);
        }}
      >
        {fieldsConfig.map((field) => (
          <label key={field.name} className="block">
            <span className="block font-black">{field.title}</span>
            <span className="my-1 block text-xs text-[#6a6d77]">{field.helper}</span>
            <textarea
              required
              value={fields[field.name]}
              onChange={(event) => changeField(field.name, event.target.value)}
              maxLength={field.name === 'task' ? 280 : 180}
              rows={3}
              className="mt-2 block w-full resize-y rounded-xl border border-black/20 bg-[#fffaf7] p-3 text-sm leading-6 outline-none focus:border-[#b85b22]"
            />
          </label>
        ))}
        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-full bg-[#1f2430] px-7 py-3.5 font-bold text-white transition hover:bg-[#a14c13]"
          >
            Собрать мой промпт →
          </button>
        </div>
      </form>
      {output ? (
        <div
          className="mt-8 rounded-2xl border border-[#f0cbaf] bg-[#fff8f1] p-5"
          data-testid="lesson-prompt-result"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-black">Готовый запрос</h3>
            <button
              type="button"
              onClick={copy}
              className="rounded-full border border-[#e8c5ac] bg-white px-5 py-2 font-bold"
            >
              {copied ? 'Скопировано' : 'Скопировать запрос'}
            </button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#33363b]">
            {output}
          </pre>
          <p className="mt-4 text-sm leading-6 text-[#64646b]">
            Скопируйте запрос и проверьте его в удобном вам AI-чате. Ответ нейросети оценивайте
            самостоятельно: верны ли факты, соблюдён ли формат, нужна ли правка.
          </p>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-white p-4 text-sm font-semibold">
            <input
              type="checkbox"
              checked={completed}
              onChange={(event) => setCompleted(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#a14c13]"
            />
            Я проверила(а) ответ нейросети и поняла(а), что нужно улучшить
          </label>
          {completed ? (
            <p className="mt-3 font-bold text-[#85501d]" role="status">
              Пробный урок пройден. Ваш прогресс в этой демоверсии не сохраняется.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
