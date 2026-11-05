import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "Manus AI: агент для многошаговых задач | Бизнес-завод",
  description: "Manus AI: что умеет, как использовать и для каких многошаговых задач подходит AI-агент.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Manus AI"
      title="Manus AI: когда нужен не чат, а исполнитель"
      description="Manus полезен там, где задача состоит из нескольких этапов: собрать информацию, обработать её, подготовить результат и пройти по цепочке действий."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Исследование</h2><p className="mt-3 leading-7 text-[#646a75]">Собирает информацию и превращает её в структурированный результат.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Документы</h2><p className="mt-3 leading-7 text-[#646a75]">Может последовательно обрабатывать материалы и собирать итог.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Проекты</h2><p className="mt-3 leading-7 text-[#646a75]">Подходит для задач, где одного ответа мало и нужен процесс.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Делегирование</h2><p className="mt-3 leading-7 text-[#646a75]">Хороший пример перехода от AI-чата к AI-агенту.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
