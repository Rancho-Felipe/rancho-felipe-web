import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ranchofelipe.ph'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{ path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }> = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/casita', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/gazebo', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/farm', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/rates', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/gallery', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/reviews', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/getting-here', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/house-rules', priority: 0.4, changeFrequency: 'monthly' },
  ]

  const now = new Date()

  return pages.map((page) => ({
    url: `${BASE}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
