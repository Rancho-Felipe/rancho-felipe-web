import type { Metadata } from 'next'
import { SiteMap } from '@/components/site-map/site-map'
import { HOTSPOTS } from '@/components/site-map/plan'
import { Gallery } from '@/components/gallery-server'
import { getDayView, firstBookableDate } from '@/lib/booking/availability'
import { photoSources, grounds } from '@/lib/content'

export const metadata: Metadata = {
  title: 'The Farm — Two Pools, Kubo, Half Court & Bonfire',
  description:
    'A plan of Rancho Felipe: two A-frame casitas and their pool, the gazebo and its pool, the kubo, half court, bonfire and tent area. Tap any part of the farm to see it.',
  alternates: { canonical: '/farm' },
}

// Availability is read live on every request. A cached farm map is a map that
// can show a booked date as free.
export const dynamic = 'force-dynamic'

export default async function FarmPage() {
  const today = firstBookableDate()
  const units = await getDayView(today, 10)

  // Resolve every hotspot photo on the server so the client bundle carries only
  // the URLs it renders.
  const photos = Object.fromEntries(
    HOTSPOTS.map((spot) => [spot.photo, photoSources(spot.photo)]),
  )

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-14">
        <p className="eyebrow">The whole place, one group at a time</p>
        <h1 className="mt-3 text-title font-display">The farm</h1>
        <p className="mt-4 max-w-2xl text-lede text-stone">
          The Casita and the Gazebo sit on the same farm but book separately. Pick a date and the
          map shows you what&apos;s open — tap anywhere on the plan to see it.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-5">
        <SiteMap initialDate={today} initialUnits={units} photos={photos} />
        <p className="mt-3 text-xs text-stone">
          The plan is drawn to show what&apos;s where, not to scale.
        </p>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-5">
        <h2 className="text-title font-display">Around the grounds</h2>
        <div className="mt-8">
          <Gallery slugs={grounds.gallery} />
        </div>
      </section>
    </>
  )
}
