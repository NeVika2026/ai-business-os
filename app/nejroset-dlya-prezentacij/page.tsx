import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "Нейросеть для презентаций: как сделать презентацию с ИИ | Бизнес-завод",
  description: "Нейросети для презентаций: как быстро собрать структуру, текст и визуальную подачу с помощью ИИ.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Презентации"
      title="Как сделать презентацию с помощью нейросети"
      description="ИИ может помочь не только оформить слайды, но и сначала выстроить логику: цель, структура, аргументы, текст и визуальную подачу."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Структура</h2><p className="mt-3 leading-7 text-[#646a75]">Собрать последовательность слайдов под задачу и аудиторию.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Текст</h2><p className="mt-3 leading-7 text-[#646a75]">Сократить, усилить и адаптировать содержание.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Визуал</h2><p className="mt-3 leading-7 text-[#646a75]">Подобрать стиль, композицию и идеи для иллюстраций.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Автоматизация</h2><p className="mt-3 leading-7 text-[#646a75]">Превратить исходный текст или документ в черновик презентации.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
