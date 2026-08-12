import { describe, expect, it } from 'vitest'
import { quote, selectBand, PricingError, type RateBand } from '@/lib/booking/pricing'

/* The real rate cards, transcribed in Phase 0. If these numbers ever stop
   matching the owner's posters, these tests should fail. */

const CASITA_BANDS: RateBand[] = [
  { package: 'DAY_TOUR', minPax: 1, maxPax: 10, price: 6000 },
  { package: 'DAY_TOUR', minPax: 11, maxPax: 20, price: 7500 },
  { package: 'NIGHT_TOUR', minPax: 1, maxPax: 10, price: 6500 },
  { package: 'NIGHT_TOUR', minPax: 11, maxPax: 20, price: 8000 },
  { package: 'FULL_STAY', minPax: 1, maxPax: 10, price: 12000 },
  { package: 'FULL_STAY', minPax: 11, maxPax: 20, price: 15000 },
]

const GAZEBO_BANDS: RateBand[] = [
  { package: 'DAY_TOUR', minPax: 1, maxPax: 10, price: 3500 },
  { package: 'DAY_TOUR', minPax: 11, maxPax: 16, price: 5000 },
  { package: 'NIGHT_TOUR', minPax: 1, maxPax: 10, price: 4500 },
  { package: 'NIGHT_TOUR', minPax: 11, maxPax: 16, price: 6000 },
  { package: 'FULL_STAY', minPax: 1, maxPax: 10, price: 10500 },
  { package: 'FULL_STAY', minPax: 11, maxPax: 16, price: 13500 },
]

const base = {
  extraGuestFee: 300,
  extensionHours: 0,
  addOns: [],
  depositPercent: 30,
}

const casita = { ...base, unitId: 'casita' as const, bands: CASITA_BANDS, extensionRatePerHour: 500 }
const gazebo = { ...base, unitId: 'gazebo' as const, bands: GAZEBO_BANDS, extensionRatePerHour: 300 }

describe('rate bands', () => {
  it('prices the casita exactly as the rate card does', () => {
    expect(quote({ ...casita, package: 'DAY_TOUR', paxTotal: 8, paxUnder4: 0 }).total).toBe(6000)
    expect(quote({ ...casita, package: 'NIGHT_TOUR', paxTotal: 8, paxUnder4: 0 }).total).toBe(6500)
    expect(quote({ ...casita, package: 'FULL_STAY', paxTotal: 8, paxUnder4: 0 }).total).toBe(12000)
    expect(quote({ ...casita, package: 'DAY_TOUR', paxTotal: 15, paxUnder4: 0 }).total).toBe(7500)
    expect(quote({ ...casita, package: 'FULL_STAY', paxTotal: 20, paxUnder4: 0 }).total).toBe(15000)
  })

  it('prices the gazebo exactly as the rate card does', () => {
    expect(quote({ ...gazebo, package: 'DAY_TOUR', paxTotal: 10, paxUnder4: 0 }).total).toBe(3500)
    expect(quote({ ...gazebo, package: 'NIGHT_TOUR', paxTotal: 10, paxUnder4: 0 }).total).toBe(4500)
    expect(quote({ ...gazebo, package: 'FULL_STAY', paxTotal: 16, paxUnder4: 0 }).total).toBe(13500)
  })

  it('moves a group up to the band it lands in, not a per-head price', () => {
    // 11 guests at the gazebo falls into the 16-guest band. That is how the
    // printed card works — you pay the band, not per head.
    expect(quote({ ...gazebo, package: 'DAY_TOUR', paxTotal: 11, paxUnder4: 0 }).total).toBe(5000)
    // The gap the owner has not priced yet: 11-15 all land on the 16 band.
    expect(quote({ ...gazebo, package: 'DAY_TOUR', paxTotal: 14, paxUnder4: 0 }).total).toBe(5000)
  })

  it('refuses to guess when a package has no rate at all', () => {
    expect(() =>
      quote({ ...casita, bands: [], package: 'DAY_TOUR', paxTotal: 4, paxUnder4: 0 }),
    ).toThrow(PricingError)
  })
})

describe('children under four', () => {
  it('does not charge for them', () => {
    const withKids = quote({ ...casita, package: 'DAY_TOUR', paxTotal: 12, paxUnder4: 4 })
    // 12 people, 4 of them under 4 -> 8 chargeable -> the 10-guest band.
    expect(withKids.chargeableGuests).toBe(8)
    expect(withKids.total).toBe(6000)
  })

  it('can pull a group down into a cheaper band', () => {
    const withoutKids = quote({ ...casita, package: 'DAY_TOUR', paxTotal: 11, paxUnder4: 0 })
    const withKids = quote({ ...casita, package: 'DAY_TOUR', paxTotal: 11, paxUnder4: 1 })
    expect(withoutKids.total).toBe(7500)
    expect(withKids.total).toBe(6000)
  })

  it('rejects more children than guests', () => {
    expect(() => quote({ ...casita, package: 'DAY_TOUR', paxTotal: 3, paxUnder4: 5 })).toThrow(
      PricingError,
    )
  })
})

describe('extra guests above the largest band', () => {
  it('charges 300 a head, and only for the overflow', () => {
    const result = quote({ ...casita, package: 'FULL_STAY', paxTotal: 23, paxUnder4: 0 })
    expect(result.total).toBe(15000 + 3 * 300)
    expect(result.lines.find((l) => l.key === 'extra-guests')?.amount).toBe(900)
  })

  it('adds no overflow line when the group fits', () => {
    const result = quote({ ...casita, package: 'FULL_STAY', paxTotal: 20, paxUnder4: 0 })
    expect(result.lines.some((l) => l.key === 'extra-guests')).toBe(false)
  })
})

describe('extra hours', () => {
  it('bills 500 an hour at the casita and 300 at the gazebo', () => {
    expect(
      quote({ ...casita, package: 'DAY_TOUR', paxTotal: 6, paxUnder4: 0, extensionHours: 3 }).total,
    ).toBe(6000 + 1500)
    expect(
      quote({ ...gazebo, package: 'DAY_TOUR', paxTotal: 6, paxUnder4: 0, extensionHours: 3 }).total,
    ).toBe(3500 + 900)
  })

  it('rejects negative hours', () => {
    expect(() =>
      quote({ ...casita, package: 'DAY_TOUR', paxTotal: 6, paxUnder4: 0, extensionHours: -1 }),
    ).toThrow(PricingError)
  })
})

describe('add-ons and the deposit', () => {
  const lpgTour = { id: 'lpg-tour', name: 'LPG for cooking', price: 250, quantity: 1, payOnSite: false }
  const firewood = {
    id: 'bonfire-wood',
    name: 'Firewood for the bonfire',
    price: 250,
    quantity: 1,
    payOnSite: true,
  }

  it('takes 30% of the total', () => {
    const result = quote({ ...casita, package: 'FULL_STAY', paxTotal: 10, paxUnder4: 0 })
    expect(result.total).toBe(12000)
    expect(result.depositDue).toBe(3600)
    expect(result.balanceDue).toBe(8400)
  })

  it('includes online add-ons in the deposit basis', () => {
    const result = quote({
      ...casita,
      package: 'DAY_TOUR',
      paxTotal: 6,
      paxUnder4: 0,
      addOns: [lpgTour],
    })
    expect(result.total).toBe(6250)
    expect(result.depositDue).toBe(Math.round(6250 * 0.3))
  })

  it('keeps firewood out of the deposit, because it is paid to the caretaker', () => {
    const result = quote({
      ...casita,
      package: 'DAY_TOUR',
      paxTotal: 6,
      paxUnder4: 0,
      addOns: [firewood],
    })
    expect(result.total).toBe(6250)
    // Deposit is 30% of 6000, not of 6250.
    expect(result.depositDue).toBe(1800)
    // ...and the caretaker's 250 still has to be handed over on the day.
    expect(result.balanceDue).toBe(4450)
    expect(result.depositDue + result.balanceDue).toBe(result.total)
  })

  it('always splits the total exactly', () => {
    for (const pax of [1, 7, 10, 11, 16, 20, 25]) {
      const result = quote({
        ...casita,
        package: 'FULL_STAY',
        paxTotal: pax,
        paxUnder4: 0,
        extensionHours: 2,
        addOns: [lpgTour, firewood],
      })
      expect(result.depositDue + result.balanceDue).toBe(result.total)
      expect(Number.isInteger(result.depositDue)).toBe(true)
    }
  })
})

describe('selectBand', () => {
  it('returns the smallest band that fits', () => {
    expect(selectBand(CASITA_BANDS, 'DAY_TOUR', 10).price).toBe(6000)
    expect(selectBand(CASITA_BANDS, 'DAY_TOUR', 11).price).toBe(7500)
  })

  it('falls back to the largest band once the group is past every band', () => {
    expect(selectBand(CASITA_BANDS, 'DAY_TOUR', 40).maxPax).toBe(20)
  })
})
