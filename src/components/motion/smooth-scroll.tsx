'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

/**
 * Eases the mouse wheel so the page glides to a stop instead of jumping in
 * notches. Mounted once, in the root layout; renders nothing.
 *
 * Four decisions keep it from being the usual smooth-scroll liability:
 *
 * - Only where there is a wheel. `(hover: hover) and (pointer: fine)` is a
 *   mouse or a trackpad. Phones — most guests here — already have native
 *   momentum that is better than anything a script can fake, so they get no
 *   Lenis at all and pay nothing for it.
 *
 * - Never in admin. The owner works in long tables and forms; eased scrolling
 *   there is a lag, not a flourish.
 *
 * - Nested scrollers keep their own scroll. The narrow nav strip and the
 *   booking calendar scroll inside themselves; `allowNestedScroll` hands the
 *   wheel to them natively. The gallery lightbox is a <dialog> and is excluded
 *   by `prevent`, so wheeling over an open photo cannot move the page behind.
 *
 * - Honours reduced motion. Lenis 1.3 does this by default (lerp forced to 1,
 *   programmatic scrolls instant); it is set explicitly here so nobody flips it.
 *
 * Lenis moves the real document scroll every frame, so the CSS scroll-driven
 * animations in globals.css keep following it — nothing else has to know it
 * exists.
 */
export function SmoothScroll() {
  const pathname = usePathname()
  const lenisRef = useRef<Lenis | null>(null)
  const isAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    if (isAdmin) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const lenis = new Lenis({
      autoRaf: true,
      // 0.1 is a short, confident glide. Lower feels floaty and makes people
      // think the page is slow; higher is barely distinguishable from native.
      lerp: 0.1,
      smoothWheel: true,
      anchors: true,
      allowNestedScroll: true,
      // A tab change hands the scroll back to Next, which puts the new page at
      // the top. Without this the old page's momentum carries into the new one.
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      prevent: (node) => node.nodeName === 'DIALOG' || !!node.closest?.('dialog'),
    })

    lenisRef.current = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [isAdmin])

  // A new page has a new height. Lenis has a ResizeObserver for this, but a
  // route change can swap the whole document in one frame; telling it directly
  // means the scroll limit is never stale for the first wheel on a new tab.
  useEffect(() => {
    lenisRef.current?.resize()
  }, [pathname])

  return null
}
