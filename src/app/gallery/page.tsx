import type { Metadata } from 'next'
import Link from 'next/link'
import { Gallery } from '@/components/gallery-server'
import { getUnit, grounds, video } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photos of Rancho Felipe — the A-frame casitas, the gazebo, both pools, the kubo, the half court, the bonfire and the farm around them.',
  alternates: { canonical: '/gallery' },
}

/* Filtering is done with links rather than JavaScript, so the page works with a
   flaky connection and every filter is its own shareable URL. */
const FILTERS = [
  { key: 'all', label: 'Everything' },
  { key: 'casita', label: 'The Casita' },
  { key: 'gazebo', label: 'The Gazebo' },
  { key: 'grounds', label: 'The grounds' },
  { key: 'rooms', label: 'Rooms' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

function slugsFor(filter: FilterKey): string[] {
  const casita = getUnit('casita').gallery as string[]
  const gazebo = getUnit('gazebo').gallery as string[]
  const ground = grounds.gallery as string[]
  // The only pictures of the bedrooms are the owner's photo cards, so they get
  // their own filter rather than being dropped or mixed in with photography.
  const rooms = [
    'collage-casita-1',
    'collage-casita-2',
    'collage-gazebo-room-1',
    'collage-gazebo-room-2',
    'collage-kitchen-dining',
  ]

  switch (filter) {
    case 'casita':
      return casita
    case 'gazebo':
      return gazebo
    case 'grounds':
      return ground
    case 'rooms':
      return rooms
    default:
      return [...new Set([...casita, ...gazebo, ...ground, ...rooms])]
  }
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>
}) {
  const params = await searchParams
  const active = (FILTERS.find((f) => f.key === params.show)?.key ?? 'all') as FilterKey
  const slugs = slugsFor(active)

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-14">
        <p className="eyebrow">{slugs.length} photos</p>
        <h1 className="mt-3 text-title font-display">Gallery</h1>
        <p className="mt-4 max-w-2xl text-lede text-stone">
          All taken at the farm. Tap any photo to see it bigger.
        </p>

        <nav aria-label="Filter photos" className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Link
              key={filter.key}
              href={filter.key === 'all' ? '/gallery' : `/gallery?show=${filter.key}`}
              aria-current={active === filter.key ? 'true' : undefined}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                active === filter.key
                  ? 'border-pool bg-night-raised text-paper'
                  : 'border-night-edge text-stone hover:border-stone/50'
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-5">
        <Gallery slugs={slugs} />
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-5">
        <h2 className="text-title font-display">Walk through it</h2>
        <p className="mt-3 max-w-xl text-sm text-stone">
          Filmed on the property, one clip per unit.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {(['casita-tour', 'gazebo-tour'] as const).map((key) => {
            const clip = video[key]
            return (
              <figure key={key} className="overflow-hidden rounded-2xl border border-night-edge">
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
                <figcaption className="px-4 py-3 text-sm text-stone">
                  {key === 'casita-tour' ? 'The Casita' : 'The Gazebo'} ·{' '}
                  {Math.round(clip.durationSec)} seconds
                </figcaption>
              </figure>
            )
          })}
        </div>
      </section>
    </>
  )
}
