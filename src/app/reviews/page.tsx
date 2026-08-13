import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { Photo } from '@/components/photo'
import { links } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Reviews',
  description:
    'What guests say about Rancho Felipe — real reviews left on Facebook and Airbnb by people who stayed at the farm in Teresa, Rizal.',
  alternates: { canonical: '/reviews' },
}

export const dynamic = 'force-dynamic'

export default async function ReviewsPage() {
  const reviews = await db.review.findMany({
    where: { hidden: false },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
  })

  const average =
    reviews.length > 0
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : null

  return (
    <>
      <section className="mx-auto max-w-4xl px-5 pt-14">
        <p className="eyebrow">In their own words</p>
        <h1 className="mt-3 text-title font-display">What guests say</h1>
        <p className="mt-4 max-w-2xl text-lede text-stone">
          Left on Facebook and Airbnb by people who actually stayed. Nothing here was written for
          the website.
        </p>

        {average && (
          <p className="mt-6 font-data text-sm text-stone">
            <span className="text-field">{'★'.repeat(Math.round(Number(average)))}</span>{' '}
            <span className="text-paper">{average}</span> from {reviews.length} reviews
          </p>
        )}
      </section>

      <section className="mx-auto mt-10 max-w-4xl px-5">
        <ul className="space-y-5">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex flex-col gap-5 rounded-2xl border border-night-edge bg-night-raised p-6 sm:flex-row"
            >
              {review.imageSlug && (
                <div className="w-full shrink-0 overflow-hidden rounded-xl sm:w-40">
                  <Photo
                    slug={review.imageSlug}
                    sizes="(min-width: 640px) 10rem, 100vw"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="min-w-0">
                <p className="font-data text-xs text-field">
                  {'★'.repeat(review.rating)}
                  <span className="text-stone">{'★'.repeat(5 - review.rating)}</span>
                </p>
                <blockquote className="mt-3 text-paper">“{review.text}”</blockquote>
                <p className="mt-4 text-xs text-stone">
                  {review.author ?? 'Guest'}
                  {review.dateLabel && <span> · {review.dateLabel}</span>}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-2xl border border-night-edge p-6">
          <h2 className="font-display text-base">More on Airbnb</h2>
          <p className="mt-1.5 text-sm text-stone">
            Both units have their own listing, each with its own reviews.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={links.airbnbCasita}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-stone/40 px-5 py-2.5 text-sm text-paper hover:border-stone"
            >
              The Casita on Airbnb
            </a>
            <a
              href={links.airbnbGazebo}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-stone/40 px-5 py-2.5 text-sm text-paper hover:border-stone"
            >
              The Gazebo on Airbnb
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
