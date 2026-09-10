import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rancho-felipe-web.vercel.app'

/* lastmod is a crawl-priority hint, and Google discards the signal entirely for
   a site whose dates it finds unreliable. Building these from `new Date()` gave
   all nine URLs the build timestamp, so every deploy — including one that only
   touched robots.ts — told Google that all nine pages had just changed. The
   homepage was claiming a change on 9 September when its copy had not moved
   since 14 August.

   A site whose whole problem is that Google will not crawl it cannot afford a
   discredited freshness signal, so these are real dates: the day each page's
   own content last changed.

   When you change a page, bump that page's date and leave the others alone. A
   date left stale is a far smaller error than one that is falsely fresh —
   Google ignores the first and learns to distrust the second. */
const pages: Array<{
  path: string
  revised: string
  priority: number
  changeFrequency: 'weekly' | 'monthly'
}> = [
  { path: '', revised: '2026-08-14', priority: 1, changeFrequency: 'weekly' },
  { path: '/casita', revised: '2026-08-16', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/gazebo', revised: '2026-08-16', priority: 0.9, changeFrequency: 'monthly' },
  // The plan was redrawn the way the owner says the farm is actually arranged.
  { path: '/farm', revised: '2026-08-17', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/rates', revised: '2026-08-16', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/gallery', revised: '2026-08-16', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/reviews', revised: '2026-08-16', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/getting-here', revised: '2026-08-16', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/house-rules', revised: '2026-08-16', priority: 0.4, changeFrequency: 'monthly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({
    url: `${BASE}${page.path}`,
    lastModified: page.revised,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
