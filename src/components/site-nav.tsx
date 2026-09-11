'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* The definite articles are gone from the first three. "The Casita" is the
   unit's name and stays that everywhere else on the site, but an eighth link
   pushed this row onto two lines at 1280px, and three redundant "The"s were
   the cheapest twelve characters on the bar — cheaper than shortening a label
   someone actually navigates by, or hiding the social marks. */
export const NAV = [
  { href: '/casita', label: 'Casita' },
  { href: '/gazebo', label: 'Gazebo' },
  { href: '/farm', label: 'The Farm' },
  // Sits with the place rather than with the practicalities: someone planning a
  // debut is choosing a venue, not comparing rate cards.
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/rates', label: 'Rates' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/getting-here', label: 'Getting here' },
]

function useIsCurrent() {
  const pathname = usePathname()
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`)
}

/** Wide screens: the links sit inline in the header bar. */
export function SiteNavWide() {
  const isCurrent = useIsCurrent()

  return (
    <nav aria-label="Main" className="ml-auto hidden xl:block">
      <ul className="flex items-center gap-6 text-sm">
        {NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
              className={`transition-colors hover:text-paper ${
                isCurrent(item.href) ? 'text-paper' : 'text-stone'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Phones and tablets: a strip under the header that scrolls sideways.
 *
 * A hamburger would put the whole site behind one tap, and most guests here
 * arrive on a phone — every page stays visible instead. The fade on the right
 * edge is what says the row continues; without it a scrollable row just looks
 * like one that has been cut off.
 */
export function SiteNavNarrow() {
  const isCurrent = useIsCurrent()

  return (
    <nav aria-label="Main" className="relative xl:hidden">
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max items-center gap-2 px-5 pb-3">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
                /* py-3 rather than py-1.5: these pills were 34px tall, and this
                   is the whole of the site's navigation on a phone. Apple asks
                   for 44px and Google for 48px; 34 is a thumb landing on the
                   wrong link. 46px costs twelve pixels of header height. */
                className={`block whitespace-nowrap rounded-full border px-3.5 py-3 text-sm transition-colors ${
                  isCurrent(item.href)
                    ? 'border-pool bg-night-raised text-paper'
                    : 'border-night-edge text-stone'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-night to-transparent"
      />
    </nav>
  )
}
