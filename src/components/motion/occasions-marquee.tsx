import Link from 'next/link'
import { AFrameMark } from '@/components/site-header'

/**
 * What people actually book the farm for, sliding past slowly.
 *
 * These are the occasions the events page is built around and the ones guests
 * name in their reviews — debuts, reunions, despedidas — not a stock list of
 * "weddings, corporate, parties". A searcher planning a binyag should see the
 * word binyag.
 */
const OCCASIONS = [
  'Birthdays',
  'Debuts',
  'Family reunions',
  'Team outings',
  'Despedidas',
  'Binyag',
  'Bridal showers',
  'Barkada nights',
  'Christmas parties',
  'Night tours',
]

function Group({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      className="marquee-group"
      // The second copy exists only to close the loop visually. A screen
      // reader should hear the list once.
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : 'Occasions guests book the farm for'}
    >
      {OCCASIONS.map((name) => (
        <li key={name} className="flex items-center gap-[2.25rem] whitespace-nowrap">
          <span className="font-display text-2xl text-paper/90 sm:text-4xl">{name}</span>
          <AFrameMark className="h-5 w-6 shrink-0 text-pool sm:h-6 sm:w-8" />
        </li>
      ))}
    </ul>
  )
}

export function OccasionsMarquee() {
  return (
    <section className="reveal mt-16 border-y border-night-edge py-8 sm:py-10">
      {/* Wraps rather than squeezes: on a phone the eyebrow and the link do
          not fit side by side, and squeezing left "FOR" alone on a line. */}
      <div className="mx-auto mb-5 flex max-w-6xl flex-wrap items-baseline justify-between gap-x-4 gap-y-2 px-5">
        <p className="eyebrow">What people book it for</p>
        <Link
          href="/events"
          className="shrink-0 text-sm text-pool-lift underline-offset-4 hover:underline"
        >
          Plan an event <span className="cta-arrow" aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="marquee">
        <div className="marquee-track">
          <Group />
          <Group hidden />
        </div>
      </div>
    </section>
  )
}
