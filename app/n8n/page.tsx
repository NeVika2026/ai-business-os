import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "n8n для бизнеса: автоматизация и AI-агенты | Бизнес-завод",
  description: "n8n для бизнеса: автоматизация процессов, интеграции, AI-агенты и сценарии без ручной рутины.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="n8n"
      title="n8n для автоматизации бизнеса"
      description="n8n подходит тем, кому нужен более гибкий контроль над автоматизациями, интеграциями и AI-логикой. Особенно полезен для сложных цепочек и агентных сценариев."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Интеграции</h2><p className="mt-3 leading-7 text-[#646a75]">Связка API, CRM, баз данных и внешних сервисов.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">AI-агенты</h2><p className="mt-3 leading-7 text-[#646a75]">Сценарии с инструментами, памятью и многошаговой логикой.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Автоматизация</h2><p className="mt-3 leading-7 text-[#646a75]">Обработка заявок, контента, документов и внутренних процессов.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Контроль</h2><p className="mt-3 leading-7 text-[#646a75]">Больше свободы в логике и настройке сложных сценариев.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
