'use client'

import { usePathname } from 'next/navigation'

/**
 * Keeps the guest site's header and footer off the admin screens.
 *
 * The root layout wraps everything, so without this the owner gets two headers
 * stacked — the guest nav and the admin nav — which on a phone means two
 * scrolling tab strips one above the other, and half the screen gone before any
 * content. Admin brings its own header; this hides the other one.
 *
 * The children are still server components. They are passed through as a prop,
 * so nothing here forces them into the client bundle.
 */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null
  return <>{children}</>
}
