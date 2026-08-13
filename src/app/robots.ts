import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ranchofelipe.ph'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nothing here is secret — those routes are guarded server-side — but a
      // guest's booking page has their name and phone number on it and has no
      // business in a search index.
      disallow: ['/admin', '/admin/', '/book/', '/api/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
