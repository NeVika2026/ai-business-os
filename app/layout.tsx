import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://business-zavod.vercel.app'),
  title: {
    default: 'Нейросети и ИИ для работы и бизнеса | Бизнес-завод',
    template: '%s',
  },
  description:
    'Нейросети, ИИ-агенты, автоматизация и практическое обучение для работы и бизнеса. Готовые сценарии, инструменты и AI-системы.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Бизнес-завод',
    title: 'Нейросети и ИИ для работы и бизнеса | Бизнес-завод',
    description:
      'Готовые AI-инструменты, ИИ-агенты, автоматизации и обучение — от одной задачи до работающей системы.',
    url: 'https://business-zavod.vercel.app',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
