import Link from 'next/link'
import { Hero } from '@/components/hero'
import { Photo } from '@/components/photo'
import { UNIT_ORDER, getUnit, peso, reviews, policy, links } from '@/lib/content'

const GUESTS_INCLUDED = policy.guests.includedGuests

/** The cheapest way into a unit — its day tour for ten guests or fewer. */
function lowestRate(slug: 'casita' | 'gazebo') {
  return Math.min(...Object.values(policy.pricing[slug]))
}

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* --- The two units ------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-title font-display">Two places to stay.</h2>
        <p className="mt-3 max-w-xl text-lede text-stone">
          They sit on the same farm but book separately, each with its own pool. One group in the
          Casita doesn&apos;t close the Gazebo.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {UNIT_ORDER.map((slug) => {
            const unit = getUnit(slug)
            const accent = slug === 'casita' ? 'text-pool' : 'text-brick'
            const ring = slug === 'casita' ? 'hover:border-pool' : 'hover:border-brick'
            return (
              <Link
                key={slug}
                href={`/${slug}`}
                className={`group block overflow-hidden rounded-2xl border border-night-edge bg-night-raised transition-colors ${ring}`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <Photo
                    slug={unit.featured}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-6">
                  <h3 className={`font-display text-xl ${accent}`}>{unit.name}</h3>
                  <p className="mt-2 text-sm text-stone">{unit.shortDescription}</p>
                  <p className="mt-4 font-data text-sm text-paper">
                    from {peso(lowestRate(slug))}
                    <span className="text-stone">
                      {' '}
                      · covers {GUESTS_INCLUDED} guests · sleeps up to {unit.capacity.max}
                    </span>
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* --- What's on the farm -------------------------------------------- */}
      <section className="border-y border-night-edge bg-night-raised">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-title font-display">What&apos;s on the farm</h2>
          {/* Every card is the same 4:3, so the grid stays even. What changes is
              where each photo is cropped from: the billiard table sits at the
              bottom of a tall frame and the tent near the top, so a centred crop
              would miss the subject of both. */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                slug: 'grounds-kubo-billiards-hammock',
                focus: '50% 100%',
                title: 'Kubo and billiards',
                body: 'A full-size billiard table under a nipa roof, with a hammock strung beside it and the fields on every side.',
              },
              {
                slug: 'grounds-bonfire-pit',
                focus: '50% 80%',
                title: 'Bonfire',
                body: `A stone fire pit ringed with carved hardwood benches. The caretaker lights it and puts it out — ${peso(250)} covers the wood.`,
              },
              {
                slug: 'grounds-half-court',
                focus: '50% 50%',
                title: 'Half court',
                body: 'A full concrete half court on the grounds.',
              },
              {
                slug: 'casita-night-pool-reflection',
                focus: '50% 50%',
                title: 'Two casitas, one group',
                body: 'Both A-frames are yours — air-conditioned, lit up at night, and mirrored in the pool between them.',
              },
              {
                slug: 'grounds-tent-pitching-area',
                focus: '50% 18%',
                title: 'Tent pitching',
                body: 'Shaded ground to pitch tents if your group runs long.',
              },
              {
                slug: 'grounds-aerial-property',
                focus: '50% 50%',
                title: 'Farm views',
                body: 'Open highland field and tree line on every side.',
              },
            ].map((item) => (
              <article
                key={item.slug}
                className="flex flex-col overflow-hidden rounded-xl border border-night-edge bg-night"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <Photo
                    slug={item.slug}
                    focus={item.focus}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 p-5">
                  <h3 className="font-display text-base">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-stone">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- Reviews -------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-title font-display">What guests say</h2>
        <p className="mt-3 text-sm text-stone">
          Left on Facebook and Airbnb by people who stayed.
        </p>

        {/* The photo is the review. These are the actual groups who stayed,
            cropped out of the cards the resort posts — a face carries more than
            a star rating does. */}
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.slice(0, 3).map((review) => (
            <li
              key={review.id}
              className="flex flex-col overflow-hidden rounded-xl border border-night-edge bg-night-raised"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <Photo
                  slug={review.guestPhoto}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="font-data text-xs text-field">
                  {'★'.repeat(review.rating)}
                  <span className="text-stone">{'★'.repeat(5 - review.rating)}</span>
                </p>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-paper">
                  “{review.text}”
                </blockquote>
                <p className="mt-4 text-xs text-stone">
                  {review.author ?? 'Guest'}
                  {review.date && <span> · {review.date}</span>}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/reviews" className="text-pool-lift underline underline-offset-4">
            Read all reviews
          </Link>
          <a
            href={links.airbnbCasita}
            target="_blank"
            rel="noreferrer"
            className="text-stone underline underline-offset-4 hover:text-paper"
          >
            Prefer to book on Airbnb?
          </a>
        </div>
      </section>

      {/* --- Getting here --------------------------------------------------- */}
      <section className="border-t border-night-edge bg-night-raised">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-title font-display">An hour from the city</h2>
            <p className="mt-3 text-lede text-stone">
              Teresa, Rizal — minutes from Antipolo. The last stretch is rough road, but every
              vehicle including vans gets through.
            </p>
            <p className="mt-5 text-sm text-stone">
              {policy.security.$copy}
            </p>
            <Link
              href="/getting-here"
              className="mt-6 inline-block rounded-full border border-stone/40 px-6 py-3 text-sm text-paper transition-colors hover:border-stone"
            >
              Directions and landmarks
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-night-edge">
            <Photo
              slug="grounds-aerial-property"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </>
  )
}
