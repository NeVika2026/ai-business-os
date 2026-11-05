import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "Нейросети для недвижимости: ИИ для риелтора и брокера | Бизнес-завод",
  description: "Нейросети для недвижимости: подбор объектов, анализ, контент, работа с клиентами, объявления и автоматизация процессов.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Недвижимость"
      title="Нейросети для недвижимости и риелторов"
      description="В недвижимости AI особенно полезен там, где много повторяющейся работы: подбор, сравнение, тексты, клиентские сообщения, анализ предложений и маркетинг."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Подбор</h2><p className="mt-3 leading-7 text-[#646a75]">Сравнивать объекты и быстро собирать аргументы по вариантам.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Клиенты</h2><p className="mt-3 leading-7 text-[#646a75]">Готовить персональные сообщения и follow-up.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Контент</h2><p className="mt-3 leading-7 text-[#646a75]">Посты, карточки объектов, сценарии видео и объявления.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Автоматизация</h2><p className="mt-3 leading-7 text-[#646a75]">Связать заявки, CRM, таблицы и публикации.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
