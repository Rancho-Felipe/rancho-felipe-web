'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Today' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/rates', label: 'Rates' },
  { href: '/admin/marketing', label: 'Marketing' },
  { href: '/admin/settings', label: 'Settings' },
]

/**
 * The owner runs this from a phone, standing at the resort — so every screen
 * has to be one tap away, not hidden behind a menu. Same sideways strip as the
 * public site, and the current screen is marked so it is obvious where you are.
 */
export function AdminNav() {
  const pathname = usePathname()
  // "/admin" would otherwise light up on every page beneath it.
  const isCurrent = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <nav aria-label="Admin" className="relative">
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max items-center gap-2 px-5 pb-3 sm:px-0 sm:pb-0">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors sm:border-0 sm:px-0 sm:py-0 ${
                  isCurrent(item.href)
                    ? 'border-pool bg-night text-paper'
                    : 'border-night-edge text-stone hover:text-paper'
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
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-night-raised to-transparent sm:hidden"
      />
    </nav>
  )
}
