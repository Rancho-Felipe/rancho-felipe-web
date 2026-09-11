import type { Metadata } from 'next'
import Link from 'next/link'
import { Photo } from '@/components/photo'
import { getUnit, grounds, peso, policy } from '@/lib/content'

/* The one page the site was missing.
 *
 * Nothing here targeted the way people search for a venue — "private resort for
 * birthday Rizal", "family reunion venue Rizal", "team building venue Rizal
 * with pool" — and those bookings are larger and planned further ahead than a
 * weekend for ten. Exclusive use of the whole place is exactly what an
 * organiser is looking for, and it was only ever mentioned in passing.
 *
 * The illustrations set the mood; the photographs prove the place. That split
 * is deliberate. A drawing of a farm cannot be mistaken for a promise, and an
 * organiser deciding where to put fifty guests deserves to see the real
 * function area, the real court and the real table before they commit. */

export const metadata: Metadata = {
  /* Absolute, so the "— Rancho Felipe" template does not append. With the
     suffix the first version of this ran to seventy-nine characters and Google
     would have cut the tail off — the same mistake the Casita page had.
     "50 pax" earns its place now that the number is confirmed: guest-count
     queries are how this market searches, and nobody else is claiming it. */
  title: { absolute: 'Private Resort for Birthdays & Reunions in Rizal — 50 Pax' },
  description:
    'Take the whole farm in Teresa, Rizal for a birthday, a family reunion or a team building day. Sleeps 50 in rooms and more with tents. Function area with a stage, half court, two pools, bonfire and unlimited videoke, an hour from Metro Manila.',
  openGraph: {
    title: 'Events at Rancho Felipe — 50 pax, and more with tents',
    description:
      'Birthdays, reunions and team building on a private farm in Teresa, Rizal. Function area, half court, two pools and a bonfire.',
    url: '/events',
    images: [{ url: '/media/events/events-hero.webp', width: 1920, height: 1053, alt: 'Rancho Felipe set for a celebration' }],
  },
  alternates: { canonical: '/events' },
}

const OCCASIONS = [
  {
    slug: 'grounds-function-area-stage',
    title: 'Birthdays and debuts',
    body: 'There is a function area with a stage, so the programme has somewhere to happen that is not the middle of the lawn. Videoke runs until 2:00 AM.',
    focus: '50% 55%',
  },
  {
    slug: 'grounds-long-hardwood-table',
    title: 'Family reunions',
    body: 'One long hardwood table, two pools, and a kubo with a hammock for whoever is done swimming. Nobody else books in around you.',
    focus: '50% 50%',
  },
  {
    slug: 'grounds-half-court',
    title: 'Team building',
    body: 'A half court, open field and a tent-pitching area. Enough ground to run something properly, an hour out of the city.',
    focus: '50% 45%',
  },
]

export default function EventsPage() {
  const casita = getUnit('casita')
  const gazebo = getUnit('gazebo')
  const included = policy.guests.includedGuests
  const inRooms = grounds.capacity.sleepingInRooms

  return (
    <>
      {/* The illustration runs full-bleed behind the title. It is the one place
          on the site where a drawing leads, and it can, because it is drawn —
          nobody arrives expecting the picture. */}
      {/* On a phone the text sits BELOW the picture, not on it. Overlaid, the
          eyebrow and headline landed 30% down the hero, where the scrim is only
          about 40% opaque and the illustration is at its brightest — measured,
          not guessed. Five lines of copy over a busy drawing at 375px is
          fighting the medium, and a scrim dark enough to fix it would have hidden
          the drawing entirely. Stacking also stops the 16:9 illustration being
          cropped to a near-square slice that cut both cabins in half.

          From sm up there is room for the overlay, so the text lifts back onto
          the image and the scrim comes with it. */}
      <section className="relative isolate">
        <img
          src="/media/events/events-hero.webp"
          alt=""
          width={1920}
          height={1053}
          className="h-52 w-full object-cover sm:h-[54vh] sm:min-h-72"
          fetchPriority="high"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-t from-night via-night/55 to-night/10 sm:block"
        />
        <div className="mx-auto max-w-6xl px-5 pt-7 sm:absolute sm:inset-x-0 sm:bottom-0 sm:pt-0 sm:pb-12">
          <p className="eyebrow">One group at a time</p>
          <h1 className="mt-3 max-w-3xl text-title font-display">
            Take the whole farm for the day.
          </h1>
          <p className="mt-4 max-w-2xl text-lede text-stone">
            Birthdays, reunions and team building in Teresa, Rizal. Fifty sleep in the rooms and
            the tent area takes the rest, an hour from Metro Manila, with nobody else booked in
            around you.
          </p>
        </div>
      </section>

      {/* Photographs from here down. */}
      <section className="reveal mx-auto mt-16 max-w-6xl px-5">
        <h2 className="text-title font-display">What people book it for</h2>
        <ul className="reveal-stagger mt-8 grid gap-6 md:grid-cols-3">
          {OCCASIONS.map((item) => (
            <li
              key={item.slug}
              className="flex flex-col overflow-hidden rounded-2xl border border-night-edge bg-night-raised"
            >
              <div className="photo-frame aspect-[4/3]">
                <Photo
                  slug={item.slug}
                  focus={item.focus}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 p-6">
                <h3 className="font-display text-lg">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* --- How many fit ---------------------------------------------------- */}
      <section className="reveal mx-auto mt-20 max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h2 className="text-title font-display">Fifty in beds, and more on the grass</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone">
              {inRooms} sleep in the rooms across both units. Past that, the tent area takes
              however many more you bring — which is why the number below does not stop at the
              end of the bar.
            </p>

            {/* The bar is the point: rooms are a fixed length, tents are not, so
                the tent section runs off the end of it rather than being one
                more equal segment. A stacked bar that added up to a tidy total
                would say the opposite of what is true here. */}
            <div className="mt-8 flex items-stretch gap-1.5" aria-hidden="true">
              {/* Explicit widths, not flex-grow. Grow distributes the *free*
                  space, so the digits sitting inside each segment skewed a
                  30:20 bar to 1.45:1 — close enough to look right and wrong
                  enough to be a lie in a graphic whose whole job is the
                  proportion. */}
              <div className="flex h-11 flex-[5] overflow-hidden rounded-lg">
                <div
                  className="flex items-center justify-center bg-pool text-xs font-semibold text-night"
                  style={{ width: `${(casita.capacity.max / inRooms) * 100}%` }}
                >
                  {casita.capacity.max}
                </div>
                <div
                  className="flex items-center justify-center bg-brick text-xs font-semibold text-night"
                  style={{ width: `${(gazebo.capacity.max / inRooms) * 100}%` }}
                >
                  {gazebo.capacity.max}
                </div>
              </div>
              <div className="flex h-11 flex-[2] items-center justify-center rounded-lg border border-dashed border-field/70 bg-gradient-to-r from-field/20 to-transparent font-data text-[11px] tracking-wide text-field">
                + tents
              </div>
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-pool" />
                <dt className="text-stone">Casita</dt>
                <dd className="font-data text-paper">{casita.capacity.max}</dd>
              </div>
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-brick" />
                <dt className="text-stone">Gazebo</dt>
                <dd className="font-data text-paper">{gazebo.capacity.max}</dd>
              </div>
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm border border-dashed border-field/70" />
                <dt className="text-stone">Tent area</dt>
                <dd className="font-data text-paper">no fixed number</dd>
              </div>
            </dl>

            <p className="mt-6 max-w-xl text-sm leading-relaxed text-stone">
              Sleeping space and price are separate things. Each unit&apos;s rate covers{' '}
              {included} pax, and every guest above that adds{' '}
              {peso(policy.guests.extraGuestFee)} — so a group of fifty is priced, not turned
              away. Bringing tents? Say so when you book, so the ground is kept clear for you.
            </p>
          </div>

          <img
            src="/media/events/events-table.webp"
            alt=""
            width={1280}
            height={1045}
            loading="lazy"
            className="w-full rounded-2xl border border-night-edge"
          />
        </div>
      </section>

      {/* --- Room to do something -------------------------------------------- */}
      <section className="reveal mx-auto mt-20 max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <img
            src="/media/events/events-grounds.webp"
            alt=""
            width={1280}
            height={960}
            loading="lazy"
            className="order-2 w-full rounded-2xl border border-night-edge lg:order-1"
          />

          <div className="order-1 lg:order-2">
            <h2 className="text-title font-display">Room to actually do something</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone">
              It is a farm, not a function room with a garden attached. There is space to put a
              programme, a game and a bonfire in three different places at once.
            </p>

            <ul className="reveal-stagger mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {[
                'Function area with a stage',
                'Half basketball court',
                'Two private pools',
                'Kubo, billiards and a hammock',
                'Bonfire pit — firewood ₱250',
                'Tent area — pitch as many as you bring',
                'Unlimited videoke until 2:00 AM',
                'Parking on the property',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-stone">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-field" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- The things organisers actually ask ------------------------------ */}
      <section className="reveal mx-auto mt-20 max-w-6xl px-5">
        <h2 className="text-title font-display">The questions organisers ask first</h2>
        <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-night-edge bg-night-edge sm:grid-cols-2 lg:grid-cols-4">
          {[
            { q: 'Corkage?', a: 'None. Bring your own food, drinks and caterer.' },
            { q: 'Security deposit?', a: 'None held. Damage is charged only if it happens.' },
            { q: 'How late can we be loud?', a: 'Videoke until 2:00 AM. The farm is gated.' },
            { q: 'To hold the date?', a: `${policy.deposit.percent}% deposit. Dates go to whoever pays first.` },
          ].map((item) => (
            <div key={item.q} className="bg-night-raised p-5">
              <dt className="font-display text-base text-paper">{item.q}</dt>
              <dd className="mt-1.5 text-xs leading-snug text-stone">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* --- Book ------------------------------------------------------------ */}
      <section className="reveal mx-auto mt-20 max-w-6xl px-5 pb-4">
        <div className="rounded-2xl border border-night-edge bg-night-raised p-8 sm:p-12">
          <h2 className="text-title font-display">Pick a date</h2>
          <p className="mt-3 max-w-xl text-sm text-stone">
            You will see the whole price, including every extra guest, before anything is held.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="rounded-full bg-pool px-6 py-3 font-medium text-paper transition-colors hover:bg-pool-deep"
            >
              Check availability
            </Link>
            <Link
              href="/rates"
              className="rounded-full border border-stone/40 px-6 py-3 text-sm text-paper transition-colors hover:border-stone"
            >
              See the rates
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
