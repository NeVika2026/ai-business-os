import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "Нейросеть для видео: создание видео с помощью ИИ | Бизнес-завод",
  description: "Нейросети для видео: сценарий, генерация сцен, озвучка, монтаж и короткие ролики с помощью ИИ.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Видео"
      title="Нейросети для видео"
      description="Сегодня AI может участвовать почти во всём видеопроцессе: идея, сценарий, раскадровка, генерация сцен, голос, субтитры и финальная сборка."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Сценарий</h2><p className="mt-3 leading-7 text-[#646a75]">Хук, структура ролика и текст для озвучки.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Генерация</h2><p className="mt-3 leading-7 text-[#646a75]">Создание сцен и визуальных фрагментов.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Озвучка</h2><p className="mt-3 leading-7 text-[#646a75]">AI-голоса и подготовка дикторского текста.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Монтаж</h2><p className="mt-3 leading-7 text-[#646a75]">Сборка, субтитры, версии под разные площадки.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
