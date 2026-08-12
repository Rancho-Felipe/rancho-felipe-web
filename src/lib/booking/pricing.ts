import type { PackageKey } from '@/lib/booking/schedule'

/* ---------------------------------------------------------------------------
   Pricing.

   A pure function on purpose: no database, no clock, no network. Everything it
   needs is passed in, so the whole rate sheet can be tested without standing up
   Postgres — and so a booking's price can be recomputed years later and give the
   same answer.

   All money is whole pesos as integers. Floats have no business here.
--------------------------------------------------------------------------- */

export interface RateBand {
  package: PackageKey
  minPax: number
  maxPax: number
  price: number
}

export interface AddOnChoice {
  id: string
  name: string
  price: number
  quantity: number
  /** Firewood is handed to the caretaker on arrival, so it must not inflate the
   *  deposit the guest pays online. */
  payOnSite: boolean
}

export interface QuoteInput {
  unitId: 'casita' | 'gazebo'
  package: PackageKey
  /** Everyone in the group, including small children. */
  paxTotal: number
  /** Three and under. They stay free and never count toward fees. */
  paxUnder4: number
  bands: RateBand[]
  extraGuestFee: number
  extensionHours: number
  extensionRatePerHour: number
  addOns: AddOnChoice[]
  depositPercent: number
}

export interface QuoteLine {
  key: string
  label: string
  detail?: string
  amount: number
  payOnSite?: boolean
}

export interface Quote {
  lines: QuoteLine[]
  /** The room rate before extras. */
  subtotal: number
  extrasTotal: number
  total: number
  /** What the guest pays now to hold the date. */
  depositDue: number
  /** What they hand over on arrival, including anything paid on site. */
  balanceDue: number
  chargeableGuests: number
  band: RateBand
}

export class PricingError extends Error {}

/**
 * Picks the rate band a group falls into.
 *
 * Rate cards are banded, not per-head: the Casita prices "10 and below" and
 * "11 to 20", the Gazebo "10 and below" and "16". A group of 12 at the Gazebo
 * pays the 16-guest price, because that is the band it lands in — this is how
 * the printed cards work.
 *
 * Only above the largest band does the per-head fee start.
 */
export function selectBand(bands: RateBand[], pkg: PackageKey, chargeableGuests: number): RateBand {
  const forPackage = bands
    .filter((band) => band.package === pkg)
    .sort((a, b) => a.maxPax - b.maxPax)

  if (forPackage.length === 0) {
    throw new PricingError(`No rate is set for ${pkg}. Add one in admin under Rates.`)
  }

  return (
    forPackage.find((band) => chargeableGuests <= band.maxPax) ??
    forPackage[forPackage.length - 1]
  )
}

export function quote(input: QuoteInput): Quote {
  if (input.paxTotal < 1) {
    throw new PricingError('A booking needs at least one guest.')
  }
  if (input.paxUnder4 < 0 || input.paxUnder4 > input.paxTotal) {
    throw new PricingError('The number of children under 4 cannot exceed the group size.')
  }
  if (input.extensionHours < 0) {
    throw new PricingError('Extra hours cannot be negative.')
  }

  // Three and under are free, so they never enter the pricing at all.
  const chargeableGuests = input.paxTotal - input.paxUnder4
  const band = selectBand(input.bands, input.package, chargeableGuests)

  const lines: QuoteLine[] = []

  lines.push({
    key: 'base',
    label: band.maxPax >= chargeableGuests ? `Whole unit, up to ${band.maxPax} guests` : `Whole unit`,
    detail: `${chargeableGuests} charged${input.paxUnder4 > 0 ? `, ${input.paxUnder4} under 4 free` : ''}`,
    amount: band.price,
  })

  // Per-head only once the group is past the biggest printed band.
  const overflow = Math.max(0, chargeableGuests - band.maxPax)
  if (overflow > 0) {
    lines.push({
      key: 'extra-guests',
      label: `${overflow} extra ${overflow === 1 ? 'guest' : 'guests'}`,
      detail: `₱${input.extraGuestFee.toLocaleString('en-PH')} each, age 4 and up`,
      amount: overflow * input.extraGuestFee,
    })
  }

  if (input.extensionHours > 0) {
    lines.push({
      key: 'extension',
      label: `${input.extensionHours} extra ${input.extensionHours === 1 ? 'hour' : 'hours'}`,
      detail: `₱${input.extensionRatePerHour.toLocaleString('en-PH')} per hour`,
      amount: input.extensionHours * input.extensionRatePerHour,
    })
  }

  for (const addOn of input.addOns) {
    if (addOn.quantity < 1) continue
    lines.push({
      key: `addon:${addOn.id}`,
      label: addOn.quantity > 1 ? `${addOn.name} × ${addOn.quantity}` : addOn.name,
      detail: addOn.payOnSite ? 'Paid to the caretaker on arrival' : undefined,
      amount: addOn.price * addOn.quantity,
      payOnSite: addOn.payOnSite,
    })
  }

  const subtotal = band.price
  const extrasTotal = lines
    .filter((line) => line.key !== 'base')
    .reduce((sum, line) => sum + line.amount, 0)
  const total = subtotal + extrasTotal

  // The deposit is a share of what the resort collects online. Anything handed
  // to the caretaker on site is outside that.
  const onSiteTotal = lines
    .filter((line) => line.payOnSite)
    .reduce((sum, line) => sum + line.amount, 0)
  const depositBasis = total - onSiteTotal

  const depositDue = Math.round((depositBasis * input.depositPercent) / 100)
  const balanceDue = total - depositDue

  return {
    lines,
    subtotal,
    extrasTotal,
    total,
    depositDue,
    balanceDue,
    chargeableGuests,
    band,
  }
}
