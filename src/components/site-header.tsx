import Link from 'next/link'
import { BrandEmblem } from '@/components/brand-logo'
import { SiteNavWide, SiteNavNarrow } from '@/components/site-nav'

/** The A-frame silhouette, for places that want a mark without loading an image. */
export function AFrameMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden="true" fill="none">
      <path d="M9 22 15.5 3 22 22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M2 22h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12.4 22v-5.5h6.2V22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-night-edge/70 bg-night/90 backdrop-blur">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-4 px-5 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-paper">
            <BrandEmblem className="h-7 w-auto sm:h-9" />
            <span className="font-display text-sm tracking-tight">Rancho Felipe</span>
          </Link>

          <SiteNavWide />

          <Link
            href="/book"
            className="ml-auto shrink-0 rounded-full bg-pool px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pool-deep lg:ml-0"
          >
            {/* "Check availability" is too wide beside the logo on a small phone. */}
            <span className="sm:hidden">Book</span>
            <span className="hidden sm:inline">Check availability</span>
          </Link>
        </div>

        <SiteNavNarrow />
      </div>
    </header>
  )
}
