import Link from 'next/link';

import { SeoFooter, SeoHeader } from '@/components/public/seo-site-shell';

const tasks = [
  ['Сделать продающий текст', '/gotovoe'],
  ['Собрать презентацию', '/gotovoe'],
  ['Автоматизировать заявки', '/avtomatizaciya-biznesa'],
  ['Создать AI-сотрудника', '/ii-agenty'],
  ['Найти клиентов', '/ii-dlya-prodazh'],
  ['Выйти в первые деньги', '/vyyti-v-dengi'],
];

const products = [
  ['Бесплатные инструменты', 'Попробуйте платформу без оплаты и получите реальный результат.', '/gotovoe'],
  ['Готовые решения', 'Шаблоны, AI-связки, автоматизации и цифровые продукты.', '/marketplace'],
  ['Курсы', 'Практическое обучение, включая «ЁПТЕТЬ ДА НУ!».', '/kursy-nejrosetey'],
  ['Выйти в деньги', 'Упаковать профиль, собрать портфолио, найти заказ и дойти до первой оплаты.', '/vyyti-v-dengi'],
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
                Бизнес-завод · от задачи до денег
              </div>
              <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
                Сделай. Научись. Заработай.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#5b606b] lg:text-xl">
                Бесплатные AI-инструменты, готовые решения, курсы и путь к первому заказу — в одном месте.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/gotovoe" className="rounded-full bg-[#1f2430] px-7 py-3.5 font-bold text-white">
                  Попробовать бесплатно
                </Link>
                <Link href="/vyyti-v-dengi" className="rounded-full border border-black/15 bg-white px-7 py-3.5 font-bold">
                  Выйти в деньги
                </Link>
              </div>
            </div>

            <div className="self-end rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_70px_rgba(46,39,77,.10)] lg:p-8">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7357ff]">Что хотите сделать?</p>
              <div className="mt-5 grid gap-2">
                {tasks.map(([task, href]) => (
                  <Link key={task} href={href} className="rounded-2xl bg-[#f6f0ea] px-4 py-3 text-sm font-semibold transition hover:bg-[#eee5dc]">
                    {task} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7357ff]">Не только курсы</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight lg:text-6xl">Выберите результат</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {products.map(([title, text, href]) => (
              <Link key={title} href={href} className="rounded-[1.75rem] border border-black/10 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl">
                <h3 className="text-2xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 leading-7 text-[#636873]">{text}</p>
                <div className="mt-6 font-bold text-[#7357ff]">Открыть →</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-[#1f2430] text-white">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b8aaff]">Как работает Бизнес-завод</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-tight lg:text-6xl">
              Зайдите бесплатно. Получите результат. Платите только за следующий уровень.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ['1. Попробовать', 'Бесплатные инструменты и материалы без обязательной покупки.'],
                ['2. Усилить', 'Готовые решения, курсы, автоматизации и AI-сотрудники.'],
                ['3. Заработать', 'Профиль, портфолио, заказы и маршрут до первой оплаты.'],
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
