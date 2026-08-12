import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Photo } from '@/components/photo'
import { RateTable } from '@/components/rate-table'
import { Gallery } from '@/components/gallery-server'
import {
  UNIT_ORDER,
  getUnit,
  peso,
  policy,
  links,
  video,
  type UnitSlug,
} from '@/lib/content'

export const dynamicParams = false

export function generateStaticParams() {
  return UNIT_ORDER.map((unit) => ({ unit }))
}

function isUnit(value: string): value is UnitSlug {
  return (UNIT_ORDER as string[]).includes(value)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ unit: string }>
}): Promise<Metadata> {
  const { unit } = await params
  if (!isUnit(unit)) return {}
  const data = getUnit(unit)
  return {
    title: data.name,
    description: data.shortDescription,
    alternates: { canonical: `/${unit}` },
  }
}

export default async function UnitPage({
  params,
}: {
  params: Promise<{ unit: string }>
}) {
  const { unit } = await params
  if (!isUnit(unit)) notFound()

  const data = getUnit(unit)
  const accent = unit === 'casita' ? 'text-pool' : 'text-brick'
  const clip = video[unit === 'casita' ? 'casita-tour' : 'gazebo-tour']
  const airbnb = unit === 'casita' ? links.airbnbCasita : links.airbnbGazebo
  const extension = policy.extension[unit].perHour

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-14">
        <p className="eyebrow">
          {unit === 'casita' ? 'Two A-frame cabins' : 'Two gazebo rooms'}
        </p>
        <h1 className={`mt-3 text-title font-display ${accent}`}>{data.name}</h1>
        <p className="mt-4 max-w-2xl text-lede text-stone">{data.shortDescription}</p>

        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <dt className="eyebrow">Sleeps</dt>
            <dd className="mt-1 font-data text-sm text-paper">up to {data.capacity.max}</dd>
          </div>
          <div>
            <dt className="eyebrow">Aircon rooms</dt>
            <dd className="mt-1 font-data text-sm text-paper">{data.rooms.airconRooms}</dd>
          </div>
          <div>
            <dt className="eyebrow">Extra hour</dt>
            <dd className="mt-1 font-data text-sm text-paper">{peso(extension)}</dd>
          </div>
          <div>
            <dt className="eyebrow">Pool</dt>
            <dd className="mt-1 font-data text-sm text-paper">private</dd>
          </div>
        </dl>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-5">
        <div className="overflow-hidden rounded-2xl border border-night-edge">
          <Photo slug={data.featured} sizes="100vw" className="w-full object-cover" priority />
        </div>
      </section>

      {/* --- Rates ---------------------------------------------------------- */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <h2 className="text-title font-display">Rates</h2>
        <p className="mt-3 max-w-xl text-sm text-stone">
          Whole-unit prices. {policy.deposit.percent}% secures the date, the balance is paid on
          arrival.
        </p>
        <div className="mt-8">
          <RateTable unit={unit} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Extra
            label="Extra guest"
            value={peso(policy.guests.extraGuestFee)}
            note={`Age 4 and up, past the first ${policy.guests.includedGuests}`}
          />
          <Extra
            label="Under 4"
            value="Free"
            note="Three years old and below stay free"
          />
          <Extra
            label="LPG for cooking"
            value={`${peso(250)} / ${peso(500)}`}
            note="Day or night tour / full stay"
          />
          <Extra
            label="Extra hour"
            value={peso(extension)}
            note="Only when nobody is booked after you"
          />
        </div>
      </section>

      {/* --- Amenities ------------------------------------------------------ */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <h2 className="text-title font-display">What&apos;s included</h2>
        <ul className="mt-8 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {data.amenities.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-stone">
              <span aria-hidden="true" className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${unit === 'casita' ? 'bg-pool' : 'bg-brick'}`} />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* --- Gallery -------------------------------------------------------- */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <h2 className="text-title font-display">Look around</h2>
        <div className="mt-8">
          <Gallery slugs={data.gallery} />
        </div>
      </section>

      {/* --- Walkthrough video ---------------------------------------------- */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <h2 className="text-title font-display">Walk through it</h2>
        <p className="mt-3 max-w-xl text-sm text-stone">
          Filmed on the property. {Math.round(clip.durationSec)} seconds, sound on.
        </p>
        <div className="mt-8 max-w-sm overflow-hidden rounded-2xl border border-night-edge">
          <video
            className="w-full"
            controls
            preload="none"
            poster={clip.poster.jpg}
            playsInline
          >
            <source src={clip.tour.webm_720} type="video/webm" />
            <source src={clip.tour.mp4_720} type="video/mp4" />
            Your browser can&apos;t play this video.
          </video>
        </div>
      </section>

      {/* --- Book ----------------------------------------------------------- */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <div className="rounded-2xl border border-night-edge bg-night-raised p-8 sm:p-12">
          <h2 className="text-title font-display">Book {data.name.replace('The ', 'the ')}</h2>
          <p className="mt-3 max-w-lg text-sm text-stone">
            Pick your date and check-in method. You&apos;ll see the full price before you pay
            anything.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/book?unit=${unit}`}
              className={`rounded-full px-6 py-3 font-medium text-paper transition-opacity hover:opacity-90 ${unit === 'casita' ? 'bg-pool' : 'bg-brick'}`}
            >
              Check availability
            </Link>
            <a
              href={airbnb}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-stone/40 px-6 py-3 text-paper transition-colors hover:border-stone"
            >
              Prefer to book on Airbnb?
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

function Extra({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-night-edge bg-night-raised p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-data text-sm text-paper">{value}</p>
      <p className="mt-1.5 text-xs text-stone">{note}</p>
    </div>
  )
}
