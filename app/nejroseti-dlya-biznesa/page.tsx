import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Нейросети и ИИ для бизнеса: применение, инструменты и автоматизация | Бизнес-завод',
  description: 'Как использовать нейросети и ИИ в продажах, маркетинге, документах, аналитике, контенте и бизнес-процессах. Практические сценарии и готовые решения.',
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="ИИ для бизнеса"
      title="Нейросети и ИИ для бизнеса"
      description="Не обзор ради обзора. Здесь собраны прикладные сценарии: как ИИ помогает продавать, готовить контент, работать с документами, анализировать данные и убирать рутину."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Продажи', 'Квалификация лидов, ответы клиентам, подготовка предложений и работа с CRM.'],
            ['Маркетинг', 'Контент, рекламные идеи, анализ конкурентов и подготовка кампаний.'],
            ['Документы', 'Разбор, сводка, черновики, сравнение условий и извлечение фактов.'],
            ['Аналитика', 'Работа с таблицами, отчётами, показателями и управленческими вопросами.'],
            ['Поддержка', 'ИИ-помощники для типовых вопросов и внутренних инструкций.'],
            ['Автоматизация', 'Связки AI + Make/n8n + CRM + мессенджеры + таблицы.'],
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
