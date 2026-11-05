import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "ИИ для продаж: AI-инструменты, агенты и автоматизация | Бизнес-завод",
  description: "ИИ для продаж: квалификация лидов, ответы клиентам, CRM, коммерческие предложения и автоматизация.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Продажи"
      title="ИИ для продаж: быстрее обрабатывать лиды и не терять клиентов"
      description="ИИ полезен не вместо продавца, а там, где продавец теряет время: первичная обработка, подготовка ответа, сбор контекста, CRM и повторяющиеся действия."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Квалификация</h2><p className="mt-3 leading-7 text-[#646a75]">Разобрать входящий лид и понять приоритет.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Ответ клиенту</h2><p className="mt-3 leading-7 text-[#646a75]">Быстро подготовить персональный ответ на основе контекста.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">CRM</h2><p className="mt-3 leading-7 text-[#646a75]">Автоматически создавать и обновлять карточки лидов.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Follow-up</h2><p className="mt-3 leading-7 text-[#646a75]">Не забывать о повторных касаниях и следующих шагах.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
