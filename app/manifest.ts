import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Бизнес-завод',
    short_name: 'Бизнес-завод',
    description: 'AI-инструменты, обучение, готовые решения и путь к первым деньгам.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffaf5',
    theme_color: '#1f2430',
    lang: 'ru',
    icons: [
      {
        src: '/business-zavod-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
