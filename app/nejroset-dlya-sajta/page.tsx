import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "Нейросеть для сайта: как создать сайт с ИИ | Бизнес-завод",
  description: "Как создать сайт с помощью нейросетей и AI-инструментов: структура, тексты, дизайн, код и запуск.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Сайты"
      title="Как создать сайт с помощью ИИ"
      description="ИИ может ускорить путь от идеи до работающего сайта: помочь со структурой, текстами, дизайном, кодом и тестированием. Но хороший сайт всё равно начинается с задачи бизнеса."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Структура</h2><p className="mt-3 leading-7 text-[#646a75]">Определить страницы, блоки и пользовательский путь.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Контент</h2><p className="mt-3 leading-7 text-[#646a75]">Собрать тексты, офферы и SEO-структуру.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Дизайн</h2><p className="mt-3 leading-7 text-[#646a75]">Получить визуальные направления и прототипы.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Код</h2><p className="mt-3 leading-7 text-[#646a75]">Помощь с разработкой, исправлениями и запуском.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
