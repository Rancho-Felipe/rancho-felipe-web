import { PACKAGES, getUnit, peso, policy, type UnitSlug } from '@/lib/content'

/* What it costs as the group grows.
 *
 * The rate table answers "what does it cost", which is only the first half of
 * the question people actually arrive with — the second half is "and what
 * happens when we're fifteen". That is a rule, not a row: the price covers ten,
 * and every chargeable head after that adds a fixed fee. A rule is much easier
 * to believe when you can see it.
 *
 * Both numbers are computed from content/policy.json by the same arithmetic the
 * booking engine uses, so this cannot quote a total the checkout then contradicts.
 * Under-fours are free and are deliberately not modelled here — this is the
 * shape of the pricing, not a quote. */

export function PriceLadder({ unit, className = '' }: { unit: UnitSlug; className?: string }) {
  const data = getUnit(unit)
  const included = policy.guests.includedGuests
  const fee = policy.guests.extraGuestFee
  const max = data.capacity.max
  const extraHeads = Math.max(0, max - included)

  const rows = PACKAGES.map((pkg) => {
    const base = policy.pricing[unit][pkg.key]
    const extras = extraHeads * fee
    return { key: pkg.key, label: pkg.label, base, extras, total: base + extras }
  })

  const widest = Math.max(...rows.map((r) => r.total))
  const accent = unit === 'casita' ? 'bg-pool' : 'bg-brick'

  return (
    <figure className={`reveal ${className}`}>
      <figcaption className="eyebrow">What it costs as the group grows</figcaption>

      <div className="mt-5 space-y-5">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm text-paper">{row.label}</p>
              <p className="font-data text-xs text-stone">
                <span className="text-paper">{peso(row.base)}</span> for {included} pax
                {extraHeads > 0 && (
                  <>
                    {' · '}
                    <span className="text-paper">{peso(row.total)}</span> for {max}
                  </>
                )}
              </p>
            </div>

            {/* One bar, two segments: what the base covers, and what the heads
                after it add. The split is the whole point — it shows the price
                is a rule rather than a series of unrelated numbers. */}
            <div
              className="mt-2 flex h-3 overflow-hidden rounded-full bg-night-edge/70"
              aria-hidden="true"
            >
              <span
                className={`h-full ${accent}`}
                style={{ width: `${(row.base / widest) * 100}%` }}
              />
              <span
                className="h-full bg-stone/45"
                style={{ width: `${(row.extras / widest) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${accent}`} />
          Covers {included} pax
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-stone/45" />
          {peso(fee)} for each pax after that, age {policy.guests.extraGuestFeeAppliesFromAge} and up
        </span>
      </p>
    </figure>
  )
}
