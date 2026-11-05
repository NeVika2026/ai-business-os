import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "DeepSeek: как пользоваться и применять в работе | Бизнес-завод",
  description: "DeepSeek для работы и бизнеса: возможности, сценарии применения, сравнение подходов и практические задачи.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="DeepSeek"
      title="DeepSeek для работы и бизнеса"
      description="DeepSeek полезен там, где нужен ещё один сильный AI-инструмент для текста, анализа, кода, идей и рабочих задач. Здесь — без фанатизма, только практические сценарии."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Тексты и идеи</h2><p className="mt-3 leading-7 text-[#646a75]">Черновики, варианты, структура и развитие мысли.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Анализ</h2><p className="mt-3 leading-7 text-[#646a75]">Сводки, сравнения и работа с большими объёмами информации.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Код</h2><p className="mt-3 leading-7 text-[#646a75]">Помощь с логикой, разбором ошибок и техническими задачами.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Сравнение моделей</h2><p className="mt-3 leading-7 text-[#646a75]">Когда удобнее DeepSeek, а когда ChatGPT, Claude или Gemini.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
