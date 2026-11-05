import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "Нейросеть для текста: написать, сократить и улучшить текст с ИИ | Бизнес-завод",
  description: "Нейросети для текста: как писать, сокращать, редактировать и улучшать тексты для работы и бизнеса.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Тексты"
      title="Нейросети для текста: от черновика до готового материала"
      description="Главная ошибка — просить AI просто «напиши текст». Намного лучше задавать цель, аудиторию, контекст, ограничения и формат результата."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Посты</h2><p className="mt-3 leading-7 text-[#646a75]">Контент для Telegram, VK, Дзен и других площадок.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Письма</h2><p className="mt-3 leading-7 text-[#646a75]">Деловые письма, предложения, ответы и сообщения клиентам.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Редактура</h2><p className="mt-3 leading-7 text-[#646a75]">Сокращение воды, улучшение структуры и тона.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Продажи</h2><p className="mt-3 leading-7 text-[#646a75]">Офферы, объявления, скрипты и коммерческие тексты.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
