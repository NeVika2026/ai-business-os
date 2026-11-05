import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Нейросети для работы: лучшие сценарии применения ИИ | Бизнес-завод',
  description: 'Как использовать нейросети в работе: тексты, документы, презентации, аналитика, продажи, маркетинг и автоматизация. Практические примеры без лишней теории.',
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Нейросети для работы"
      title="Нейросети для работы: от одной задачи до постоянного помощника"
      description="Не нужно знать сотню сервисов. Нужно понимать, какой инструмент взять под конкретную работу и как получить нормальный результат."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            'Для предпринимателя',
            'Для риелтора',
            'Для маркетолога',
            'Для руководителя',
            'Для продавца',
            'Для специалиста по документам',
          ].map((title) => (
            <article key={title} className="rounded-3xl border border-black/10 bg-white p-6">
              <h2 className="text-xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-[#646a75]">Подбор AI-сценариев под реальные повторяющиеся задачи этой роли.</p>
            </article>
          ))}
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
