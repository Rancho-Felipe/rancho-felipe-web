/* The spread of the scores, not just their average.
 *
 * An average on its own is the one number a reader has been trained to
 * distrust — 4.8 from a handful of reviews and 4.8 from a hundred are the same
 * digits and completely different claims. Showing how many sit at each score
 * answers "is this real" in the way the average never does, and it costs one
 * pass over data the page has already loaded.
 *
 * Rows with no reviews at all are still drawn. A five-star column standing
 * alone next to four empty rows is far more convincing than a chart that
 * quietly omits the scores nobody gave. */

const SCORES = [5, 4, 3, 2, 1] as const

export function RatingSpread({ ratings, className = '' }: { ratings: number[]; className?: string }) {
  if (ratings.length === 0) return null

  const counts = SCORES.map((score) => ({
    score,
    count: ratings.filter((r) => r === score).length,
  }))
  const most = Math.max(...counts.map((c) => c.count), 1)
  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length

  return (
    <figure
      className={`reveal rounded-2xl border border-night-edge bg-night-raised p-6 sm:p-7 ${className}`}
    >
      <figcaption className="eyebrow">How the scores fall</figcaption>

      <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4">
        <p className="shrink-0">
          <span className="font-display text-4xl leading-none text-paper">
            {average.toFixed(1)}
          </span>
          <span className="ml-1.5 font-data text-sm text-stone">/ 5</span>
          <span className="mt-2 block font-data text-xs text-stone">
            {ratings.length} {ratings.length === 1 ? 'review' : 'reviews'}
          </span>
        </p>

        <ul className="min-w-[15rem] flex-1 space-y-1.5">
          {counts.map(({ score, count }) => (
            <li key={score} className="flex items-center gap-3">
              <span className="w-8 shrink-0 font-data text-xs text-stone">{score}★</span>
              <span
                className="h-2.5 flex-1 overflow-hidden rounded-full bg-night"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-field"
                  style={{ width: count === 0 ? '0%' : `${(count / most) * 100}%` }}
                />
              </span>
              <span className="w-6 shrink-0 text-right font-data text-xs text-stone tabular-nums">
                {count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="sr-only">
        Average {average.toFixed(1)} out of 5 from {ratings.length} reviews.{' '}
        {counts.map(({ score, count }) => `${count} at ${score} stars.`).join(' ')}
      </p>
    </figure>
  )
}
