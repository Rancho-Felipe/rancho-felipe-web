import { peso, type UnitSlug } from '@/lib/content'
import { getUnit, PACKAGES } from '@/lib/content'

/** The two units were priced on different marketing graphics with different
 *  column names — the casita card says "Day & Night / Daytime / Night time",
 *  the gazebo card says "22HRS / DAY TOUR / NIGHT TOUR". They mean the same
 *  three packages, so this maps both onto one vocabulary. */
const COLUMN_KEYS: Record<UnitSlug, Record<string, string>> = {
  casita: { fullStay: 'dayAndNight', dayTour: 'daytime', nightTour: 'nightTime' },
  gazebo: { fullStay: 'fullStay22h', dayTour: 'dayTour', nightTour: 'nightTour' },
}

export function RateTable({ unit }: { unit: UnitSlug }) {
  const data = getUnit(unit)
  const bands = data.rates.bands as unknown as Array<Record<string, number | string>>
  const keys = COLUMN_KEYS[unit]
  const accent = unit === 'casita' ? 'text-pool' : 'text-brick'

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <caption className="sr-only">
          {data.name} rates by group size and check-in method
        </caption>
        <thead>
          <tr className="border-b hairline">
            <th scope="col" className="eyebrow py-3 pr-4 font-normal">
              Group
            </th>
            {PACKAGES.map((pkg) => (
              <th key={pkg.key} scope="col" className="py-3 pr-4 font-normal">
                <span className="eyebrow block text-paper">{pkg.label}</span>
                <span className="font-data text-xs text-stone">
                  {pkg.in}–{pkg.out}
                  {pkg.endsNextDay && <span className="align-super text-[0.6rem]">+1</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bands.map((band) => (
            <tr key={String(band.band)} className="border-b hairline">
              <th scope="row" className="py-4 pr-4 text-sm font-normal text-paper">
                {String(band.band) === '10pax-below'
                  ? '10 guests and below'
                  : unit === 'casita'
                    ? '11 to 20 guests'
                    : 'Up to 16 guests'}
              </th>
              {PACKAGES.map((pkg) => {
                const value = band[keys[pkg.key]]
                return (
                  <td key={pkg.key} className={`py-4 pr-4 font-data text-sm ${accent}`}>
                    {typeof value === 'number' ? peso(value) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
