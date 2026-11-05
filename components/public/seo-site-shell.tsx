import Link from 'next/link';

const nav = [
  { href: '/nejroseti-dlya-biznesa', label: 'ИИ для бизнеса' },
  { href: '/ii-agenty', label: 'ИИ-агенты' },
  { href: '/avtomatizaciya-biznesa', label: 'Автоматизация' },
  { href: '/nejroseti-dlya-raboty', label: 'Для работы' },
  { href: '/kursy-nejrosetey', label: 'Обучение' },
];

export function SeoHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#fffaf5]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
        <Link href="/" className="font-black tracking-tight text-[#1f2430]">
          БИЗНЕС-ЗАВОД
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#4a4f5b] lg:flex">
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
          Войти в платформу
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
            Нейросети, ИИ-агенты и автоматизация для реальной работы и бизнеса.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-black">
              {item.label}
            </Link>
          ))}
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
          Не изучайте ИИ ради ИИ. Соберите рабочую систему.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
          Внутри платформы — обучение, AI-инструменты, готовые сценарии, агенты и автоматизации.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-full bg-white px-6 py-3 font-bold text-[#1f2430]">
            Войти в платформу
          </Link>
          <Link href="/kursy-nejrosetey" className="rounded-full border border-white/30 px-6 py-3 font-bold text-white">
            Посмотреть обучение
          </Link>
        </div>
      </div>
    </section>
  );
}
