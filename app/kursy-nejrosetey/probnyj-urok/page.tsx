import type { Metadata } from 'next';
import Link from 'next/link';

import {
  CopyCoursePrompt,
  ORIGINAL_LESSON_PROMPT,
  ORIGINAL_LESSON_REVISION,
} from '@/components/public/OriginalLessonPrompt';
import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Урок 1 «Хватит смотреть на пустой пост. Сделаем свой» | Нейробунт',
  description:
    'Подлинный первый бесплатный урок курса «Нейробунт»: видео, пример семейного фотографа, запрос к ИИ, проверка фактов и самостоятельное задание.',
};

export default function OriginalCourseLesson() {
  return (
    <SeoPage
      eyebrow="Нейробунт · Первый бесплатный урок"
      title="Хватит смотреть на пустой пост. Сделаем свой"
      description="Один урок из существующего курса «Нейробунт», подготовленный 6 ноября 2026 года. Смотрим видео, создаём свой пост с помощью нейросети, проверяем факты и сохраняем результат."
    >
      <div className="mx-auto max-w-5xl space-y-9 px-5 py-12 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] bg-[#1c1c23] p-5 text-white md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#ffc397]">
              Видео существующего курса · Урок 1
            </p>
            <p className="text-sm text-white/70">4 мин 13 сек · 1280 × 720</p>
          </div>
          <video
            controls
            preload="metadata"
            playsInline
            className="aspect-video w-full rounded-2xl bg-black"
            aria-label="Первый урок курса Нейробунт"
            poster={undefined}
          >
            <source src="/course/urok-01-original.mp4" type="video/mp4" />
            Ваш браузер не поддерживает видео. Ниже доступно текстовое задание урока.
          </video>
          <p className="mt-4 text-sm leading-6 text-white/65">
            Исходный видеофайл «Нейробунт Урок 1» из папки проекта. Ниже — практические
            материалы из сценария этого же урока.
          </p>
        </section>
        <section className="rounded-[2rem] bg-[#252027] p-6 text-white md:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ffbc90]">
            Результат урока
          </p>
          <h2 className="mt-3 text-2xl font-black md:text-3xl">
            После урока у вас останется свой пост и запрос к ИИ
          </h2>
          <p className="mt-4 leading-7 text-white/80">
            Вы составите запрос, получите черновик поста о своей услуге, проверите факты, исправите
            формулировки и сохраните готовый текст вместе с исходным запросом. Учебный пример
            фотографа — вымышленный, не настоящее коммерческое предложение.
          </p>
        </section>
        <section className="space-y-5">
          <h2 className="text-3xl font-black tracking-tight">01. Отправьте исходный запрос</h2>
          <p className="leading-7 text-[#51535c]">
            В сценарии курса используется пример семейного фотографа из Белоярского. Цена, сроки и
            условия придуманы для демонстрации и не должны публиковаться как реальная услуга.
          </p>
          <CopyCoursePrompt
            value={ORIGINAL_LESSON_PROMPT}
            label="Запрос для копирования — пример фотографа"
          />
        </section>
        <section className="space-y-5">
          <h2 className="text-3xl font-black tracking-tight">
            02. Проверьте ответ и попросите исправить
          </h2>
          <p className="leading-7 text-[#51535c]">
            Сверьте длительность съёмки (1 час), цену (5 000 рублей), 20 фотографий и срок
            готовности (10 дней). Если нейросеть придумала скидки, свободные даты, отзывы или
            обещания — удалите их. При сокращении убедитесь, что необходимые условия не пропали.
          </p>
          <CopyCoursePrompt
            value={ORIGINAL_LESSON_REVISION}
            label="Запрос на правку — из сценария урока"
          />
        </section>
        <section className="rounded-[2rem] border border-[#e9d0b8] bg-white p-6 md:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#a44d0b]">
            03. Самостоятельное задание
          </p>
          <h2 className="mt-3 text-2xl font-black">Теперь ваша очередь</h2>
          <p className="mt-4 leading-7 text-[#555963]">
            Возьмите одну свою услугу. Укажите, что предлагаете, кому, сколько это стоит, что входит
            и как с вами связаться. Если цена зависит от задачи, не придумывайте её. Попросите
            нейросеть написать пост, проверьте каждый факт и исправьте хотя бы одну фразу под себя.
          </p>
          <p className="mt-4 leading-7 text-[#555963]">
            Сохраните финальный текст и запрос в документе «Мой первый пост». Урок выполнен, когда у
            вас есть собственный проверенный пост, а не просто просмотренное видео.
          </p>
          <Link
            href="/kursy-nejrosetey"
            className="mt-7 inline-flex rounded-full bg-[#1f2430] px-6 py-3 font-bold text-white"
          >
            Вернуться к программе курса ↗
          </Link>
        </section>
      </div>
    </SeoPage>
  );
}
