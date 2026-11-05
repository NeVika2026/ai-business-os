import Link from 'next/link';

import { SeoFooter, SeoHeader } from '@/components/public/seo-site-shell';

const directions = [
  {
    href: '/nejroseti-dlya-biznesa',
    title: 'Нейросети и ИИ для бизнеса',
    text: 'Продажи, маркетинг, документы, аналитика, контент и внутренние процессы.',
  },
  {
    href: '/ii-agenty',
    title: 'ИИ-агенты',
    text: 'Цифровые сотрудники, которые не только отвечают, но и выполняют задачи.',
  },
  {
    href: '/avtomatizaciya-biznesa',
    title: 'Автоматизация бизнеса',
    text: 'Make, n8n, CRM, Telegram, VK, таблицы и автоматические цепочки.',
  },
  {
    href: '/nejroseti-dlya-raboty',
    title: 'Нейросети для работы',
    text: 'Практические сценарии для предпринимателя, риелтора, маркетолога и руководителя.',
  },
  {
    href: '/kursy-nejrosetey',
    title: 'Обучение нейросетям',
    text: 'Не теория, а рабочие навыки: от промптов до агентов и автоматизаций.',
  },
];

const tasks = [
  'Написать текст',
  'Сделать презентацию',
  'Создать видео',
  'Собрать сайт',
  'Автоматизировать заявки',
  'Создать AI-сотрудника',
  'Разобрать документы',
  'Найти клиентов',
];

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-[#fffaf5] text-[#1f2430]">
      <SeoHeader />

      <main>
        <section className="overflow-hidden border-b border-black/10">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-28">
            <div>
              <div className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#7357ff]">
                Бизнес-завод · AI для реальной работы
              </div>
              <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
                Нейросети и ИИ для работы и бизнеса
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#5b606b] lg:text-xl">
                Готовые AI-инструменты, ИИ-агенты, автоматизации и обучение — от одной задачи до работающей системы.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/kursy-nejrosetey" className="rounded-full bg-[#1f2430] px-7 py-3.5 font-bold text-white">
                  Начать обучение
                </Link>
                <Link href="/login" className="rounded-full border border-black/15 bg-white px-7 py-3.5 font-bold">
                  Открыть платформу
                </Link>
              </div>
            </div>

            <div className="self-end rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_70px_rgba(46,39,77,.10)] lg:p-8">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7357ff]">Что хотите сделать?</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {tasks.map((task) => (
                  <div key={task} className="rounded-2xl bg-[#f6f0ea] px-4 py-3 text-sm font-semibold">
                    {task}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-[#666b75]">
                Бизнес-завод строится вокруг задачи человека, а не вокруг списка из сотен нейросетей.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7357ff]">Куда идти</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight lg:text-6xl">Выберите задачу, а не технологию</h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {directions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[1.75rem] border border-black/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <h3 className="text-2xl font-black tracking-tight">{item.title}</h3>
                <p className="mt-3 leading-7 text-[#636873]">{item.text}</p>
                <div className="mt-6 font-bold text-[#7357ff]">Открыть →</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-[#1f2430] text-white">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b8aaff]">Почему Бизнес-завод</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-tight lg:text-6xl">
              Не очередной каталог нейросетей. Рабочая система.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ['Инструменты', 'Понятно, какой AI использовать под конкретную задачу.'],
                ['Автоматизации', 'Повторяющиеся действия собираются в готовые цепочки.'],
                ['Обучение', 'Курс «ЁПТЕТЬ ДА НУ!» ведёт от первых действий до собственной AI-системы.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/15 bg-white/5 p-6">
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className="mt-3 leading-7 text-white/65">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SeoFooter />
    </div>
  );
}
