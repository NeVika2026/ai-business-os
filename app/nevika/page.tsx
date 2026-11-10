import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'НеВика — 5 бесплатных запросов ChatGPT для бизнеса | AI Бизнес-Завод',
  description: 'Пять бесплатных запросов ChatGPT: диагностика, предложение, ответ на «дорого», Reels без лица и план на неделю. Без регистрации.',
  alternates: { canonical: '/nevika' },
};

const exercises = [
  ['01', 'Диагностика', 'Попросить ИИ сначала изучить ситуацию, а потом предлагать решения.'],
  ['02', 'Предложение', 'Объяснить клиенту конкретную пользу, а не обещать «высокое качество».'],
  ['03', 'Ответ на «дорого»', 'Продолжить разговор без выдуманных скидок и давления.'],
  ['04', 'Reels без лица', 'Сделать короткий сценарий с реальной демонстрацией результата.'],
  ['05', 'План на 7 дней', 'Проверить одну гипотезу и измерить отклик.'],
];

const practicum = [
  'Диагностика бизнеса и сегменты покупателей',
  'Коммерческое предложение и честное сравнение',
  'Ответы на заявки, возражения и напоминания',
  'Смета, цена и FAQ из реальных вопросов',
  'Reels, контент, лид-магнит и аналитика',
  'Три практических сценария и план на 7 дней',
];

export default function NevikaPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#13141a] text-[#f7f5f2]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-8">
          <Link href="/nevika" className="text-xl font-black tracking-tight">
            НеВика <span className="text-[#ff7b35]">/ ИИ без заморочек</span>
          </Link>
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            Внутри AI Бизнес-Завода
          </Link>
        </div>
      </header>

      <main>
        <section className="relative isolate mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 md:grid-cols-[1.04fr_.96fr] md:px-8 md:pb-24 md:pt-24">
          <div className="pointer-events-none absolute -right-56 top-10 -z-10 h-[520px] w-[520px] rounded-full bg-[#ff7935]/10 blur-[130px]" />
          <div>
            <div className="inline-flex rounded-full border border-[#ff7935]/40 bg-[#ff7935]/10 px-4 py-2 text-xs font-black tracking-[.15em] text-[#ffb58f]">
              БЕСПЛАТНЫЙ ПРАКТИЧЕСКИЙ НАБОР
            </div>
            <h1 className="mt-7 text-5xl font-black leading-[1.07] tracking-tight md:text-[4.2rem]">
              ChatGPT опять советует <span className="text-[#ff7935]">«вести соцсети»?</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
              Подготовила пять запросов для реальных бизнес-задач: от разбора ситуации до ответов клиентам и плана действий. Без магии, общих обещаний и обязательной регистрации.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/nevika/5-zaprosov" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#ff7935] px-7 py-4 text-base font-black text-[#1d1110] transition hover:bg-[#ff975b]">
                Забрать 5 запросов бесплатно
              </Link>
              <a href="#praktikum" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/25 px-6 py-4 font-bold text-white transition hover:border-white">
                Посмотреть практикум
              </a>
            </div>
            <p className="mt-4 text-sm text-white/45">Открываются прямо на сайте. Можно копировать и сохранять как PDF.</p>
          </div>

          <div className="relative self-center">
            <div className="absolute -inset-5 rounded-[2.3rem] bg-gradient-to-br from-[#ff7935]/15 via-[#24242d] to-[#111116] blur-xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#24262e] p-5 shadow-[0_25px_90px_rgba(0,0,0,.5)] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-black tracking-[.16em] text-[#ff9d66]">ДЕМОНСТРАЦИЯ</span>
                <span className="text-xs text-white/45">запрос → результат</span>
              </div>
              <div className="mt-6 ml-8 rounded-2xl border border-white/10 bg-[#3b3c46] p-5 text-sm leading-6 text-white/90">
                Напиши пост про ремонт квартир.
              </div>
              <div className="mt-4 mr-9 rounded-2xl border border-white/10 bg-[#1a1c23] p-5">
                <p className="text-xs font-bold text-[#ff9d66]">ОБЫЧНЫЙ ОТВЕТ</p>
                <p className="mt-2 text-lg font-bold">«Качественный ремонт — залог уюта»</p>
                <p className="mt-2 text-xs text-white/45">Клиент так и не понял, что вы делаете.</p>
              </div>
              <div className="my-4 flex justify-center"><span className="rounded-full bg-[#ff7935] px-5 py-2 text-xs font-black text-[#1c1716]">ДОБАВЛЯЕМ ФАКТЫ</span></div>
              <div className="ml-8 rounded-2xl border border-[#ff7935]/35 bg-[#342c2d] p-5 text-sm leading-6">
                Для занятых владельцев квартир. Берём на себя мастеров и закупки. Цель — запись на замер.
              </div>
              <div className="mt-4 mr-5 rounded-2xl border border-[#ff7935]/25 bg-[#1c1e25] p-5">
                <p className="text-xs font-bold text-[#ff9d66]">НОВЫЙ ВАРИАНТ</p>
                <p className="mt-2 text-base font-semibold leading-7">
                  «После работы не хочется искать мастеров и ездить за материалами? Мы организуем закупки и работу бригады. Запишитесь на замер».
                </p>
              </div>
              <p className="mt-5 text-xs leading-5 text-white/45">Учебный пример. Проверяйте факты и условия перед публикацией.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#191a22]">
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#ff9b63]">Что внутри бесплатного набора</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">Пять запросов, которые можно проверить сегодня</h2>
            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {exercises.map(([no, title, description]) => (
                <article key={no} className="rounded-[1.4rem] border border-white/10 bg-[#24252d] p-6">
                  <span className="text-3xl font-black text-[#ff7935]">{no}</span>
                  <h3 className="mt-4 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/65">{description}</p>
                </article>
              ))}
            </div>
            <Link href="/nevika/5-zaprosov" className="mt-8 inline-flex items-center gap-2 font-black text-[#ffac7c] underline underline-offset-4 hover:text-white">
              Открыть все пять запросов
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8" id="praktikum">
          <div className="grid gap-10 rounded-[2rem] border border-[#ff7935]/25 bg-gradient-to-br from-[#34272b] via-[#22232c] to-[#171820] p-7 md:grid-cols-[1.2fr_.8fr] md:p-12">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#ff9b63]">Следующий уровень</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">15 запросов для бизнеса</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/70">
                Расширенный практикум: отдельные инструменты для продаж, переписки, контента и оценки результатов. Плюс три учебных сценария и план на неделю.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {practicum.map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm leading-6">{item}</div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-[1.5rem] border border-white/15 bg-[#17181e] p-6">
              <p className="text-sm text-white/55">Планируемая стоимость</p>
              <p className="mt-3 text-6xl font-black tracking-tight">990 <span className="text-4xl">₽</span></p>
              <p className="mt-5 text-sm leading-6 text-white/65">Вместе с PDF — версии запросов для копирования. Файл выдаётся только после подтверждённой оплаты.</p>
              <button type="button" disabled className="mt-7 cursor-not-allowed rounded-2xl bg-white/20 px-6 py-4 text-center font-black text-white/65">
                Оплата подключается
              </button>
              <p className="mt-3 text-xs leading-5 text-[#e6b99c]">Покупка пока недоступна. Мы не собираем оплату без работающей выдачи материалов.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
          <div className="rounded-2xl border border-white/10 bg-[#20212a] p-7 md:p-9">
            <h2 className="text-2xl font-black">Нужен Telegram?</h2>
            <p className="mt-3 max-w-3xl leading-7 text-white/70">Нет, чтобы забрать бесплатные запросы, переходить в мессенджер не нужно. Здесь можно сразу получить пользу; Telegram останется дополнительным каналом с разборами, а не обязательным шагом.</p>
            <Link href="/nevika/5-zaprosov" className="mt-5 inline-flex rounded-xl bg-[#ff7935] px-5 py-3 font-black text-[#1d1110]">Получить бесплатные запросы</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs leading-6 text-white/50">
        НеВика · ИИ без заморочек · проект внутри AI Бизнес-Завода. Примеры учебные; результаты не гарантируются.
      </footer>
    </div>
  );
}
