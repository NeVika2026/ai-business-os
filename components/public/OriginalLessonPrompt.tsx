'use client';

import { useState } from 'react';

export const ORIGINAL_LESSON_PROMPT =
  'Напиши пост для ВКонтакте от лица семейного фотографа. Это учебный пример. Данные: съёмка в Белоярском; прогулка на улице для семьи с детьми; длительность 1 час; стоимость 5 000 рублей; результат — 20 обработанных фотографий в течение 10 дней. Фотограф помогает выбрать место и подсказывает, как встать в кадре. Аудитория — родители, которые хотят семейные фотографии, но переживают, что дети не смогут спокойно позировать. Начни с узнаваемой ситуации, затем объясни предложение и условия. В конце предложи написать в личные сообщения слово «СЕМЬЯ», чтобы обсудить дату. Объём — до 900 знаков. Пиши тепло, простыми словами, без пафоса, штампов и давления. Не придумывай опыт, отзывы, скидки, свободные даты и гарантии. Если важных данных не хватает, спроси меня.';

export const ORIGINAL_LESSON_REVISION =
  'Перепиши этот пост проще и короче, до 650 знаков. Начни с ситуации: на семейных фото обычно не хватает того, кто всех фотографирует. Убери рекламные штампы, превосходные степени и давление. Сохрани цену, длительность, количество фотографий, срок готовности и призыв написать «СЕМЬЯ». Не добавляй новые факты и обещания.';

export function CopyCoursePrompt({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-[#dec8b9] bg-[#fff9f4] p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-black text-[#26242c]">{label}</h3>
        <button
          type="button"
          className="rounded-full border border-[#c38663] bg-white px-5 py-2 text-sm font-bold text-[#6b3118]"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? 'Скопировано' : 'Копировать запрос'}
        </button>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#34323a]">{value}</p>
    </div>
  );
}
