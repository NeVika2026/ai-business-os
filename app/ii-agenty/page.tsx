import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'ИИ-агенты для бизнеса: что это, как создать и внедрить | Бизнес-завод',
  description: 'ИИ-агенты и AI-сотрудники для бизнеса: как работают, какие задачи выполняют, как создать агента и связать его с реальными процессами.',
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="ИИ-агенты"
      title="ИИ-агенты, которые не только отвечают, но и делают"
      description="AI-агент получает задачу, использует инструменты, работает с файлами и сервисами, выполняет последовательность действий и возвращает готовый результат."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="space-y-4">
          {[
            ['ИИ-агент для продаж', 'Разбирает лид, собирает контекст, готовит ответ и помогает обновлять CRM.'],
            ['ИИ-агент для контента', 'Исследует тему, собирает публикацию и готовит материалы под разные площадки.'],
            ['ИИ-помощник руководителя', 'Сводит данные, помогает с документами, планами и контролем задач.'],
            ['Hermes и Manus', 'Практические примеры агентных систем и делегирования многошаговых задач.'],
          ].map(([title, text]) => (
            <article key={title} className="rounded-3xl border border-black/10 bg-white p-6">
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-[#646a75]">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
