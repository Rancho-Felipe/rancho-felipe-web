import type { Metadata } from 'next'
import { Photo } from '@/components/photo'
import { business, directions, links, contact } from '@/lib/content'

export const metadata: Metadata = {
  title: 'How to Get Here — Teresa, Rizal, an Hour from Manila',
  description:
    'How to reach Rancho Felipe in Teresa, Rizal — by car via the Aqua Joe water station, or by jeepney to Teresa Public Market and a tricycle to Maximiano Compound.',
  alternates: { canonical: '/getting-here' },
}

const { lat, lng } = business.geo

export default function GettingHerePage() {
  const waze = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  const embed = `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`

  return (
    <>
      <section className="mx-auto max-w-4xl px-5 pt-14">
        <p className="eyebrow">An hour from Metro Manila</p>
        <h1 className="mt-3 text-title font-display">Getting here</h1>
        <address className="mt-4 text-lede not-italic text-stone">
          {business.address.street}, {business.address.barangay}
          <br />
          {business.address.city}, {business.address.province}
        </address>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={links.maps}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-pool px-6 py-3 text-sm font-medium text-paper"
          >
            Open in Google Maps
          </a>
          <a
            href={waze}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-stone/40 px-6 py-3 text-sm text-paper hover:border-stone"
          >
            Open in Waze
          </a>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-4xl px-5">
        <div className="overflow-hidden rounded-2xl border border-night-edge">
          <iframe
            src={embed}
            title="Map showing Rancho Felipe in Teresa, Rizal"
            width="100%"
            height="380"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block border-0"
          />
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-4xl px-5">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-xl">Driving</h2>
            <ol className="mt-4 space-y-4">
              {directions.byCar.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="font-data text-sm text-pool">{index + 1}</span>
                  <span className="text-sm text-stone">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 rounded-lg border border-night-edge bg-night-raised px-4 py-3 text-sm text-stone">
              The last stretch is rough road, but every vehicle gets through — cars and vans
              included. Look for the{' '}
              <span className="text-paper">{directions.landmark}</span>; that&apos;s your turn.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl">By commute</h2>
            <ol className="mt-4 space-y-4">
              {directions.byCommute.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="font-data text-sm text-brick">{index + 1}</span>
                  <span className="text-sm text-stone">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-4xl px-5">
        <div className="overflow-hidden rounded-2xl border border-night-edge">
          <Photo slug="directions-infographic" sizes="(min-width: 768px) 56rem, 100vw" className="w-full" />
        </div>
        <p className="mt-3 text-xs text-stone">The resort&apos;s own directions card.</p>
      </section>

      <section className="mx-auto mt-14 max-w-4xl px-5">
        <h2 className="text-title font-display">Lost on the way?</h2>
        <p className="mt-3 text-sm text-stone">
          Call and someone will talk you in. The same number reaches both units.
        </p>
        <a
          href={`tel:${contact.casita.mobile.replace(/-/g, '')}`}
          className="mt-5 block max-w-sm rounded-xl border border-night-edge bg-night-raised p-5 hover:border-pool"
        >
          <p className="eyebrow">Call the resort</p>
          <p className="mt-1.5 font-data text-xl text-paper">{contact.casita.mobile}</p>
          <p className="mt-1 text-xs text-stone">{contact.casita.channels.join(', ')}</p>
        </a>
      </section>
    </>
  )
}
