'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const NAV = [
  { href: '/casita', label: 'The Casita' },
  { href: '/gazebo', label: 'The Gazebo' },
  { href: '/farm', label: 'The Farm' },
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
    <nav aria-label="Main" className="ml-auto hidden lg:block">
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
    <nav aria-label="Main" className="relative lg:hidden">
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max items-center gap-2 px-5 pb-3">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
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
