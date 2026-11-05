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
    '/chatgpt',
    '/deepseek',
    '/manus-ai',
    '/make',
    '/n8n',
    '/nejroset-dlya-prezentacij',
    '/nejroset-dlya-teksta',
    '/nejroset-dlya-video',
    '/nejroset-dlya-sajta',
    '/ii-dlya-prodazh',
    '/nejroseti-dlya-nedvizhimosti',
  ];

  return routes.map((route, index) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? 'daily' : 'weekly',
    priority: index === 0 ? 1 : index <= 5 ? 0.9 : 0.8,
  }));
}
