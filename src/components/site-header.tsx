import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'

const NAV = [
  { href: '/casita', label: 'The Casita' },
  { href: '/gazebo', label: 'The Gazebo' },
  { href: '/farm', label: 'The Farm' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/rates', label: 'Rates' },
  { href: '/getting-here', label: 'Getting here' },
]

/** The A-frame is the shape of the whole place — two of them stand over the
 *  pool, and they are what the resort is recognised by. It carries the brand
 *  everywhere a logo would normally go. */
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
    <header className="sticky top-0 z-40 border-b border-night-edge/70 bg-night/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
        <Link href="/" aria-label="Rancho Felipe, home">
          <BrandLogo className="h-9 w-auto sm:h-11" width={200} />
        </Link>

        <nav aria-label="Main" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-6 text-sm text-stone">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-paper">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/book"
          className="ml-auto rounded-full bg-pool px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pool-deep md:ml-0"
        >
          Check availability
        </Link>
      </div>
    </header>
  )
}
