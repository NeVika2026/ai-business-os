import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "ChatGPT: как пользоваться, возможности и применение в работе | Бизнес-завод",
  description: "Как пользоваться ChatGPT для работы и бизнеса: тексты, анализ, документы, идеи, автоматизация и практические сценарии.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="ChatGPT"
      title="ChatGPT для работы и бизнеса"
      description="Используйте ChatGPT не как игрушку, а как рабочий инструмент: для текстов, документов, анализа, идей, подготовки материалов и связки с другими сервисами."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Для текстов</h2><p className="mt-3 leading-7 text-[#646a75]">Черновики, редактура, посты, письма, сценарии и коммерческие предложения.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Для анализа</h2><p className="mt-3 leading-7 text-[#646a75]">Разбор документов, таблиц, сравнений и сложной информации.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Для бизнеса</h2><p className="mt-3 leading-7 text-[#646a75]">Идеи, процессы, инструкции, продажи, маркетинг и клиентские коммуникации.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Для автоматизации</h2><p className="mt-3 leading-7 text-[#646a75]">Связки с Make, n8n, CRM, Telegram и другими сервисами.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
