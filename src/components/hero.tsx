import Link from 'next/link'
import { PACKAGES, video } from '@/lib/content'

/**
 * The thesis of the whole site: Rancho Felipe sells time windows, not nights.
 * The three windows are the first thing a guest reads, before any prose.
 *
 * The loop is 8.5 seconds, silent and 1 MB — muted autoplay only, with the
 * poster carrying the frame until it arrives. Guests on mobile data get a
 * still, not a 110 MB download.
 */
export function Hero() {
  const clip = video['casita-tour']

  return (
    <section className="relative isolate flex min-h-[88svh] flex-col justify-end overflow-hidden">
      <video
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        poster={clip.poster.jpg}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src={clip.hero.webm} type="video/webm" />
        <source src={clip.hero.mp4} type="video/mp4" />
      </video>

      {/* The footage is bright midday. Without this the type is unreadable. */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/75 to-night/25"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-32">
        <p className="eyebrow">Teresa, Rizal</p>

        <h1 className="mt-4 max-w-3xl text-display font-display">
          A private farm,
          <br />
          booked one group
          <br />
          at a time.
        </h1>

        <dl className="mt-9 max-w-md border-t hairline">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.key}
              className="flex items-baseline justify-between gap-4 border-b hairline py-2.5"
            >
              <dt className="eyebrow text-paper">{pkg.label}</dt>
              <dd className="font-data text-sm text-stone">
                <span className="text-paper">{pkg.inLabel}</span>
                <span className="px-1.5 text-stone">→</span>
                <span className="text-paper">{pkg.outLabel}</span>
                {pkg.endsNextDay && <span className="pl-1 text-xs align-super">+1</span>}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/book"
            className="rounded-full bg-pool px-6 py-3 font-medium text-paper transition-colors hover:bg-pool-deep"
          >
            Check availability
          </Link>
          <Link
            href="/farm"
            className="rounded-full border border-stone/40 px-6 py-3 text-paper transition-colors hover:border-stone"
          >
            See the farm
          </Link>
        </div>
      </div>
    </section>
  )
}
