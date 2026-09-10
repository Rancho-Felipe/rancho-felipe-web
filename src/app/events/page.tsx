import type { Metadata } from 'next'
import Link from 'next/link'
import { Photo } from '@/components/photo'
import { getUnit, peso, policy } from '@/lib/content'

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
  title: 'Private Resort for Birthdays, Reunions & Team Building in Rizal',
  description:
    'Take the whole farm in Teresa, Rizal for a birthday, a family reunion or a team building day. Function area with a stage, half court, two pools, bonfire and unlimited videoke, an hour from Metro Manila.',
  openGraph: {
    title: 'Events at Rancho Felipe — the whole farm, one group',
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

  return (
    <>
      {/* The illustration runs full-bleed behind the title. It is the one place
          on the site where a drawing leads, and it can, because it is drawn —
          nobody arrives expecting the picture. */}
      <section className="relative isolate">
        <img
          src="/media/events/events-hero.webp"
          alt=""
          width={1920}
          height={1053}
          className="h-[46vh] min-h-64 w-full object-cover sm:h-[54vh]"
          fetchPriority="high"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-night via-night/55 to-night/10"
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-8 sm:pb-12">
          <p className="eyebrow">One group at a time</p>
          <h1 className="mt-3 max-w-3xl text-title font-display">
            Take the whole farm for the day.
          </h1>
          <p className="mt-4 max-w-2xl text-lede text-stone">
            Birthdays, reunions and team building in Teresa, Rizal — an hour from Metro Manila,
            with nobody else booked in around you.
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
            <h2 className="text-title font-display">How many of you fit</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone">
              The two units book separately, and each price covers {included} pax with{' '}
              {peso(policy.guests.extraGuestFee)} for every guest after that. For a bigger group,
              book both and the whole farm is yours.
            </p>

            <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-night-edge bg-night-edge sm:grid-cols-3">
              <div className="bg-night-raised p-5">
                <dt className="eyebrow">The Casita</dt>
                <dd className="mt-1.5 font-display text-2xl text-pool">up to {casita.capacity.max}</dd>
              </div>
              <div className="bg-night-raised p-5">
                <dt className="eyebrow">The Gazebo</dt>
                <dd className="mt-1.5 font-display text-2xl text-brick">up to {gazebo.capacity.max}</dd>
              </div>
              <div className="bg-night-raised p-5">
                <dt className="eyebrow">Both together</dt>
                <dd className="mt-1.5 font-display text-2xl text-paper">
                  up to {casita.capacity.max + gazebo.capacity.max}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs text-stone">
              Planning for more than {casita.capacity.max + gazebo.capacity.max}? Message the
              resort before you pay a deposit — better to hear yes or no now than on the day.
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
                'Tent-pitching area',
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
