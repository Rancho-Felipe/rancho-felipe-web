'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * The persistent "Check availability" bar on phones.
 *
 * Most guests reach this site on mobile data, and on a phone the header button
 * scrolls away within a screen. This keeps the one action that matters within
 * reach the whole way down.
 *
 * Hidden on the pages where it would be noise: the booking flow itself, a
 * guest's own booking page, and anything under /admin.
 */
const HIDE_ON = ['/book', '/admin']

export function BookingBar() {
  const pathname = usePathname()
  if (HIDE_ON.some((prefix) => pathname.startsWith(prefix))) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 p-3 md:hidden">
      <Link
        href="/book"
        className="pointer-events-auto flex items-center justify-center gap-2 rounded-full bg-pool px-6 py-3.5 text-sm font-medium text-paper shadow-lg shadow-night/60"
      >
        Check availability
      </Link>
    </div>
  )
}
