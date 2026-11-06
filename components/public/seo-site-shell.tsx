import Link from 'next/link';

const nav = [
  { href: '/gotovoe', label: 'Бесплатно' },
  { href: '/market', label: 'Маркетплейс' },
  { href: '/vyyti-v-dengi', label: 'Выйти в деньги' },
  { href: '/kursy-nejrosetey', label: 'Курсы' },
  { href: '/avtomatizaciya-biznesa', label: 'Автоматизация' },
];

const quickLinks = [
  { href: '/chatgpt', label: 'ChatGPT' },
  { href: '/deepseek', label: 'DeepSeek' },
  { href: '/manus-ai', label: 'Manus AI' },
  { href: '/make', label: 'Make' },
  { href: '/n8n', label: 'n8n' },
  { href: '/nejroset-dlya-prezentacij', label: 'Презентации' },
  { href: '/nejroset-dlya-teksta', label: 'Тексты' },
  { href: '/nejroset-dlya-video', label: 'Видео' },
  { href: '/nejroset-dlya-sajta', label: 'Сайты' },
  { href: '/ii-dlya-prodazh', label: 'Продажи' },
  { href: '/nejroseti-dlya-nedvizhimosti', label: 'Недвижимость' },
];

export function SeoHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#fffaf5]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
        <Link href="/" className="font-black tracking-tight text-[#1f2430]">
          БИЗНЕС-ЗАВОД
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-[#4a4f5b] lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-black">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/login"
          className="rounded-full bg-[#1f2430] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          Войти
        </Link>
      </div>
    </header>
  );
}

export function SeoFooter() {
  return (
    <footer className="border-t border-black/10 bg-[#f4eee8]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm text-[#555b66] md:grid-cols-2 lg:px-8">
        <div>
          <div className="font-black text-[#1f2430]">БИЗНЕС-ЗАВОД</div>
          <p className="mt-2 max-w-xl">
            Бесплатные инструменты, обучение, готовые решения и путь от навыка к первым деньгам.
          </p>
        </div>
        <div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-black">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-xs text-[#777d87] hover:text-black">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SeoPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fffaf5] text-[#1f2430]">
      <SeoHeader />
      <main>
        <section className="border-b border-black/10">
          <div className="mx-auto max-w-5xl px-5 py-20 lg:px-8 lg:py-28">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#7357ff]">{eyebrow}</div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-7xl">
              {title}
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[#5b606b] lg:text-xl">{description}</p>
          </div>
        </section>
        {children}
      </main>
      <SeoFooter />
    </div>
  );
}

export function SeoCta() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
      <div className="rounded-[2rem] bg-[#1f2430] p-8 text-white lg:p-12">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b8aaff]">Бизнес-завод</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight lg:text-5xl">
          Не изучайте ИИ ради ИИ. Получайте результат.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
          Начните бесплатно, соберите рабочий навык, купите готовое решение или выйдите в первые деньги.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/gotovoe" className="rounded-full bg-white px-6 py-3 font-bold text-[#1f2430]">
            Попробовать бесплатно
          </Link>
          <Link href="/login" className="rounded-full border border-white/30 px-6 py-3 font-bold text-white">
            Войти
          </Link>
        </div>
      </div>
    </section>
  );
}
