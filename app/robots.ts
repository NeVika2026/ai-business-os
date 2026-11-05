import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/home/', '/dashboard/', '/settings/', '/cabinet/', '/crm/', '/projects/'],
    },
    sitemap: 'https://business-zavod.vercel.app/sitemap.xml',
    host: 'https://business-zavod.vercel.app',
  };
}
