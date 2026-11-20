import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'ЁПТЕТЬ ДА НУ! — программа практического курса | Бизнес-завод AI',
  description:
    'Практический курс по нейросетям: тексты, изображения, видео, документы, собственные инструменты и новые услуги. Бесплатный видеоурок уже доступен.',
};

const directions = [
  {
    number: '01',
    title: 'Начать пользоваться AI',
    text: 'От первого запроса до уверенной постановки задач, контекста и проверки ответов.',
    result: 'Рабочие запросы и собственная база контекста',
  },
  {
    number: '02',
    title: 'Тексты и соцсети',
    text: 'Посты, сообщения клиентам, контент-планы, сценарии и редактура без шаблонных фраз.',
    result: 'Материалы для публикаций и продвижения',
  },
  {
    number: '03',
    title: 'Фото, дизайн и видео',
    text: 'Обложки, AI-фотосессии, карточки товаров, раскадровки, короткие ролики, озвучка и монтаж.',
    result: 'Визуальные материалы и готовый короткий ролик',
  },
  {
    number: '04',
    title: 'Документы и аналитика',
    text: 'Разбор PDF и договоров, таблицы, сравнение предложений, расчёты и проверка источников.',
    result: 'Проверенный разбор реальной задачи',
  },
  {
    number: '05',
    title: 'Свои цифровые помощники',
    text: 'Мини-CRM, калькуляторы, простые сайты, прототипы приложений и повторяемые процессы.',
    result: 'Прототип инструмента под собственную задачу',
  },
  {
    number: '06',
    title: 'Новые услуги и портфолио',
    text: 'Как оформить результаты в примеры работ и предложить полезную услугу клиенту.',
    result: 'Кейсы для портфолио без обещаний заработка',
  },
] as const;

const workshops = [
  { title: 'Создать текст', detail: 'Пост, сообщение или недельный план', href: '/sozdat/tekst' },
  { title: 'Сделать обложку', detail: 'Графический шаблон в PNG', href: '/sozdat/kartinka' },
  { title: 'Собрать видеозаставку', detail: 'Анимированный текст в WebM', href: '/sozdat/video' },
] as const;

export default function CoursePage() {
  return (
    <SeoPage
      eyebrow="Один авторский курс внутри Бизнес-завода AI"
      title="ЁПТЕТЬ ДА НУ!"
      description="Не курс про одну кнопку и не сборник секретных промптов. Учимся создавать полезные вещи для себя, бизнеса и клиентов — с проверкой результата."
    >
      <div className="mx-auto max-w-6xl space-y-12 px-5 py-12 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] bg-[#201a27] p-7 text-white lg:p-12">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffc38f]">
            Первый урок уже можно посмотреть
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight lg:text-5xl">
            Хватит смотреть на пустой пост. Сделаем свой.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/80">
            Настоящий видеоурок с примером, запросом для копирования и заданием.
            Вы уйдёте не с конспектом, а с собственным проверенным постом.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/kursy-nejrosetey/probnyj-urok"
              className="inline-flex rounded-full bg-[#ff8629] px-6 py-3.5 font-black text-[#26150d] hover:bg-[#ffa65d]"
            >
              Смотреть бесплатный видеоурок ↗
            </Link>
            <Link
              href="/kursy-nejrosetey/programma"
              className="inline-flex rounded-full border border-white/30 px-6 py-3.5 font-bold text-white hover:bg-white/10"
            >
              Посмотреть все 10 модулей ↗
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/60">
            Полная программа ещё собирается. Бесплатный урок доступен, продажа полного курса не открыта.
          </p>
        </section>

        <section id="programma" aria-labelledby="program-title">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a25018]">
            Что будем делать на курсе
          </p>
          <h2 id="program-title" className="mt-3 text-3xl font-black tracking-tight lg:text-4xl">
            От первого запроса до собственного AI-инструмента
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-[#5e5b65]">
            Это направления предварительной программы, а не обещание готовности всех уроков.
            Конкретные сервисы и задания могут уточняться до запуска.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {directions.map((direction) => (
              <article
                key={direction.number}
                className="rounded-[1.6rem] border border-[#e8d8ca] bg-white p-6 shadow-[0_10px_35px_rgba(40,30,30,.04)]"
              >
                <span className="text-sm font-black text-[#c2601c]">{direction.number}</span>
                <h3 className="mt-3 text-xl font-black text-[#25212a]">{direction.title}</h3>
                <p className="mt-3 leading-7 text-[#615d67]">{direction.text}</p>
                <p className="mt-5 border-t border-[#eee5dc] pt-4 text-sm font-bold leading-6 text-[#403542]">
                  На выходе: {direction.result}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#fff1e5] p-7 lg:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a25018]">
            Можно попробовать прямо сейчас
          </p>
          <h2 className="mt-3 text-2xl font-black text-[#28212c] lg:text-3xl">
            Три бесплатные мастерские
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-[#625664]">
            Это простые инструменты без регистрации: текстовый конструктор, графическая обложка
            и анимированная видеозаставка. Они не являются полноценной генерацией AI-фото или AI-видео.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {workshops.map((workshop) => (
              <Link
                key={workshop.href}
                href={workshop.href}
                className="rounded-2xl border border-[#f0d0b7] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="block text-lg font-black text-[#30212e]">{workshop.title} ↗</span>
                <span className="mt-2 block text-sm leading-6 text-[#736673]">{workshop.detail}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#ddd0c5] bg-white p-7 lg:p-10">
          <h2 className="text-2xl font-black lg:text-3xl">Как устроена практика</h2>
          <p className="mt-4 max-w-3xl leading-7 text-[#5d5a63]">
            Смотрим короткий пример, повторяем на своей задаче, проверяем факты и сохраняем
            результат. Никаких обещаний, что нейросеть всё сделает без вашего участия.
          </p>
          <Link
            href="/kursy-nejrosetey/probnyj-urok"
            className="mt-6 inline-flex rounded-full bg-[#25202d] px-6 py-3.5 font-bold text-white hover:bg-[#49334f]"
          >
            Начать с первого урока ↗
          </Link>
        </section>
      </div>
    </SeoPage>
  );
}
