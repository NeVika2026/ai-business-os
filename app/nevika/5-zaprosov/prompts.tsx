'use client';

import Link from 'next/link';
import { useState } from 'react';

const exercises = [
  {
    number: '01',
    title: 'Сначала разберись в ситуации',
    when: 'Когда ИИ предлагает рекламу и соцсети, ничего не зная о бизнесе.',
    prompt: 'Ты мой бизнес-аналитик. Не предлагай решения сразу. Последовательно задай мне пять вопросов: что я продаю, кто покупает, какой бюджет доступен, в какой срок нужен результат и что я уже пробовала. После ответов назови три возможных действия на ближайшие 7 дней. Для каждого напиши первый шаг, риск и способ проверить результат. Не придумывай факты и не обещай продажи.',
    example: 'Ремонт квартир в одном городе. Есть портфолио, но обращений мало. На проверку гипотез — 10 000 ₽. Сначала нужно уточнить вводные, а не предлагать любой бизнесу рекламу.',
    check: 'Есть уточнения? Учтён бюджет? Можно проверить каждое действие?',
  },
  {
    number: '02',
    title: 'Собери предложение, которое понятно',
    when: 'Когда клиент не понимает, что именно получит.',
    prompt: 'Ты редактор коммерческого предложения. Моя услуга: [УСЛУГА]. Вот что реально входит: [СОСТАВ]. Вот кому она нужна: [КЛИЕНТ]. Придумай три понятных формулировки по 1–2 предложения: нейтральную, конкретную и разговорную. Используй только данные, которые я дала. Отдельно перечисли, каких фактов не хватает, чтобы формулировка стала убедительнее.',
    example: 'Вместо «высокое качество» — конкретные обязанности: закупки, организация мастеров и отчётность, если эти услуги действительно входят в договор.',
    check: 'Нет ли обещаний минимальной цены, сроков или гарантий без подтверждения?',
  },
  {
    number: '03',
    title: 'Ответь на «дорого» без скидки',
    when: 'Когда покупатель сравнивает цены, но не состав предложения.',
    prompt: 'Я продаю [ТОВАР/УСЛУГУ] за [ЦЕНА]. В стоимость действительно входит: [СПИСОК]. Клиент пишет: «У вас дорого». Напиши три коротких варианта ответа до 200 символов: спокойный, с уточняющим вопросом и с предложением сравнить состав услуги. Не дави, не выдумывай скидки, преимущества и сроки.',
    example: '«Понимаю. Давайте сравним, что входит в стоимость. Какие варианты вы рассматриваете?» Это приглашение к разговору, а не гарантия продажи.',
    check: 'Ответ уважительный? Есть ясный следующий шаг? Не выдуманы скидки?',
  },
  {
    number: '04',
    title: 'Сделай сценарий Reels без лица',
    when: 'Когда нужно показать полезный инструмент коротким видео.',
    prompt: 'Придумай сценарий вертикального Reels на 20–25 секунд для темы [ТЕМА]. Аудитория: [ДЛЯ КОГО]. Видеоряд: только экран телефона, запись работы инструмента и крупные надписи; лица и закадрового голоса нет. Дай таблицу: секунды, что видно, текст на экране. В первые 2 секунды покажи конкретную проблему или результат. В конце дай полезное решение, а затем короткий призыв сохранить. Никаких преувеличений.',
    example: 'Покажи плохой запрос к ChatGPT, затем добавь сведения о покупателе и сравни два ответа. Не подменяй действие заставками.',
    check: 'Есть демонстрация? Читается ли на телефоне? Получает ли зритель обещанное?',
  },
  {
    number: '05',
    title: 'План на неделю вместо хаоса',
    when: 'Когда идей много, а последовательности нет.',
    prompt: 'Моя цель на 7 дней: [ЦЕЛЬ]. Ресурсы: [ВРЕМЯ В ДЕНЬ], [БЮДЖЕТ], [КАНАЛЫ]. Составь план по дням с одним главным действием в день, ожидаемым материалом на выходе и показателем проверки. Начни с самого дешёвого теста. Если данных не хватает, спроси меня, а не фантазируй. В конце предложи три критерия: продолжать, изменить подход или остановить эксперимент.',
    example: 'При 40 минутах в день сначала собери реальные вопросы клиентов, затем проверь одно предложение и только после этого измеряй отклик.',
    check: 'Задачи укладываются во время? Есть показатели, а не выдуманные продажи?',
  },
];

export function NevikaPrompts() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyPrompt(number: string, prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(number);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#13141a] text-[#f7f5f2] print:bg-white print:text-black">
      <header className="border-b border-white/10 print:hidden">
        <div className="mx-auto flex max-w-4xl justify-between gap-4 px-5 py-5">
          <Link href="/nevika" className="font-black">НеВика <span className="text-[#ff7935]">/ ИИ без заморочек</span></Link>
          <Link href="/nevika" className="text-sm text-white/60">К набору</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-12 print:max-w-none print:p-0">
        <div className="mb-12 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#36262b] to-[#1b1d26] p-7 sm:p-10 print:mb-6 print:border-0 print:bg-white print:p-0">
          <p className="text-xs font-black uppercase tracking-widest text-[#ff9d66] print:text-black">БЕСПЛАТНЫЙ ПРАКТИЧЕСКИЙ НАБОР</p>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl print:text-3xl">5 запросов ChatGPT <span className="text-[#ff7935] print:text-black">для бизнеса</span></h1>
          <p className="mt-5 text-base leading-7 text-white/75 print:text-black">Копируй, заменяй слова в квадратных скобках своими данными и проверяй ответ. Примеры учебные; гарантированных продаж нет.</p>
          <div className="mt-7 flex flex-wrap gap-3 print:hidden">
            <button type="button" onClick={() => window.print()} className="rounded-xl bg-[#ff7935] px-6 py-3 font-black text-[#17171d] hover:bg-[#ff9657]">Сохранить как PDF / распечатать</button>
            <a href="#first" className="rounded-xl border border-white/25 px-6 py-3 font-bold">Открыть запросы</a>
          </div>
          <p className="mt-5 text-sm leading-6 text-white/55 print:text-black">Не вводи персональные данные клиентов. Финансовые, страховые и юридические условия сверяй с документами.</p>
        </div>
        <div className="grid gap-6 print:gap-5">
          {exercises.map((item, index) => (
            <article id={index === 0 ? 'first' : undefined} key={item.number} className="break-inside-avoid rounded-3xl border border-white/10 bg-[#22242c] p-6 sm:p-8 print:rounded-none print:border print:border-gray-300 print:bg-white print:p-4 print:text-black">
              <div className="flex items-start gap-4">
                <span className="text-4xl font-black text-[#ff7935] print:text-black">{item.number}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black leading-tight sm:text-3xl print:text-xl">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/65 print:text-black">{item.when}</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-[#ff7935]/25 bg-[#15161d] p-5 print:border-gray-400 print:bg-white print:p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-widest text-[#ff9d66] print:text-black">КОПИРУЙ ЗАПРОС</span>
                  <button type="button" onClick={() => copyPrompt(item.number, item.prompt)} className="rounded-lg border border-[#ff7935] px-4 py-2 text-sm font-bold text-[#ffb78c] hover:bg-[#ff7935]/15 print:hidden">{copied === item.number ? 'Скопировано' : 'Скопировать'}</button>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/90 sm:text-base print:mt-2 print:text-xs print:leading-5 print:text-black">{item.prompt}</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 print:mt-3 print:grid-cols-2">
                <div><h3 className="text-xs font-black uppercase tracking-widest text-[#ff9d66] print:text-black">ПРИМЕР</h3><p className="mt-2 text-sm leading-6 text-white/65 print:text-xs print:leading-5 print:text-black">{item.example}</p></div>
                <div><h3 className="text-xs font-black uppercase tracking-widest text-[#ff9d66] print:text-black">ПРОВЕРЬ</h3><p className="mt-2 text-sm leading-6 text-white/65 print:text-xs print:leading-5 print:text-black">{item.check}</p></div>
              </div>
            </article>
          ))}
        </div>
        <section className="mt-10 break-inside-avoid rounded-3xl border border-[#ff7935]/30 bg-[#30252b] p-7 print:bg-white print:text-black">
          <p className="text-xs font-black uppercase tracking-widest text-[#ff9d66] print:text-black">КОГДА ПЯТИ ЗАПРОСОВ МАЛО</p>
          <h2 className="mt-4 text-2xl font-black">Практикум: ещё 15 запросов и маршрут на 7 дней</h2>
          <p className="mt-3 leading-7 text-white/70 print:text-black">В нём — работа с клиентскими обращениями, составом предложений, контентом и результатами. Планируемая цена 990 ₽. Оплата станет доступна только после проверки выдачи доступа.</p>
          <Link href="/nevika#praktikum" className="mt-5 inline-flex rounded-xl bg-[#ff7935] px-6 py-3 font-black text-[#17171d] print:hidden">Подробнее о практикуме</Link>
        </section>
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/50 print:hidden">НеВика — ИИ без заморочек · учебные материалы</footer>
    </div>
  );
}
