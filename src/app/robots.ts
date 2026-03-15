import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luminary.education';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/learn/', '/parent/', '/api/', '/progress/', '/achievements/', '/profile/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
