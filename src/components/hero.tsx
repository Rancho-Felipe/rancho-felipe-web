import { Fragment } from 'react'
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
/** Stagger delay for one element of the load sequence, as a CSS variable. */
const delay = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties

/**
 * The headline, one entry per line. Each is its own clipping box so it can
 * rise into view on its own beat (.hero-line in globals.css).
 */
const HEADLINE = ['A private resort', 'in Teresa, Rizal.', 'One group at a time.']

export function Hero() {
  const clip = video['casita-tour']

  return (
    <section className="relative isolate flex min-h-[88svh] flex-col justify-end overflow-hidden">
      {/* .hero-media sinks and swells as the page scrolls away from it. The
          scale is applied here, on the <video>, and the gradient above it is
          left still — so the type keeps its contrast however far it moves. */}
      <video
        className="hero-media absolute inset-0 -z-10 h-full w-full object-cover"
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

      <div className="hero-copy mx-auto w-full max-w-6xl px-5 pb-14 pt-32">
        <p className="eyebrow hero-fade" style={delay(0)}>
          Teresa, Rizal
        </p>

        {/* The old line was "A private farm, booked one group at a time." — true
            and well said, but it contained none of the words anyone types. The
            phrase people search is "private resort", and the place matters more
            than anything else in local search. Same sentence, same rhythm, now
            it says what it is and where. */}
        {/* The spaces between the lines are real text nodes. Block spans with
            nothing between them read to a crawler as "resortin Teresa" — the
            one phrase on the page that most needs to be read correctly. */}
        <h1 className="mt-4 max-w-3xl text-display font-display">
          {HEADLINE.map((line, i) => (
            <Fragment key={line}>
              {i > 0 && ' '}
              <span className="hero-line">
                <span style={{ '--i': i } as React.CSSProperties}>{line}</span>
              </span>
            </Fragment>
          ))}
        </h1>

        <p className="hero-fade mt-5 max-w-xl text-lede text-stone" style={delay(430)}>
          The whole place to yourselves — your own pool, an hour from Metro Manila.
          Day tour, night tour or a 22-hour stay.
        </p>

        <dl className="mt-9 max-w-md border-t hairline">
          {PACKAGES.map((pkg, i) => (
            <div
              key={pkg.key}
              className="hero-window flex items-baseline justify-between gap-4 border-b hairline py-2.5"
              style={delay(540 + i * 80)}
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

        <div className="hero-fade mt-9 flex flex-wrap items-center gap-3" style={delay(820)}>
          <Link
            href="/book"
            className="btn-shine rounded-full bg-pool px-6 py-3 font-medium text-paper transition-colors hover:bg-pool-deep"
          >
            Check availability <span className="cta-arrow" aria-hidden="true">→</span>
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
