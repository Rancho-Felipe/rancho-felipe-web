import { peso, policy, PACKAGES, type UnitSlug } from '@/lib/content'

/**
 * One base price per check-in method, covering up to ten guests, then ₱300 a
 * head above that.
 *
 * The printed cards used two bands per unit and were not internally consistent
 * between them — the casita's "11-20 pax" column matched a per-head calculation
 * at 15 guests for day and night but at 20 for the full stay. The owner replaced
 * that with a single rule in August 2026, and this table shows the rule rather
 * than reprinting the cards.
 */
export function RateTable({ unit }: { unit: UnitSlug }) {
  const rates = policy.pricing[unit]
  const included = policy.guests.includedGuests
  const extra = policy.guests.extraGuestFee
  const accent = unit === 'casita' ? 'text-pool' : 'text-brick'

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-left">
          <caption className="sr-only">
            Rates by check-in method, covering up to {included} guests
          </caption>
          <thead>
            <tr className="border-b hairline">
              <th scope="col" className="eyebrow py-3 pr-4 font-normal">
                Check in
              </th>
              <th scope="col" className="eyebrow py-3 pr-4 font-normal">
                Hours
              </th>
              <th scope="col" className="eyebrow py-3 font-normal">
                Up to {included} guests
              </th>
            </tr>
          </thead>
          <tbody>
            {PACKAGES.map((pkg) => (
              <tr key={pkg.key} className="border-b hairline">
                <th scope="row" className="py-4 pr-4 font-normal">
                  <span className="block text-sm text-paper">{pkg.label}</span>
                  <span className="font-data text-xs text-stone">
                    {pkg.inLabel} – {pkg.outLabel}
                    {pkg.endsNextDay && <span className="align-super text-[0.6rem]"> +1</span>}
                  </span>
                </th>
                <td className="py-4 pr-4 font-data text-sm text-stone">{pkg.hours}h</td>
                <td className={`py-4 font-data text-base ${accent}`}>
                  {peso(rates[pkg.key])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-stone">
        Every price covers the whole unit for up to {included} guests. After that it&apos;s{' '}
        <span className="text-paper">{peso(extra)} per guest</span>, and children three and under
        stay free.
      </p>
    </div>
  )
}
