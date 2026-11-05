import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://business-zavod.vercel.app';
  const routes = [
    '',
    '/nejroseti-dlya-biznesa',
    '/ii-agenty',
    '/avtomatizaciya-biznesa',
    '/nejroseti-dlya-raboty',
    '/kursy-nejrosetey',
  ];

  return routes.map((route, index) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? 'daily' : 'weekly',
    priority: index === 0 ? 1 : 0.8,
  }));
}
