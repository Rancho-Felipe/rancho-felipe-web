import { describe, expect, it } from 'vitest'
import { quote, selectBand, PricingError, type RateBand } from '@/lib/booking/pricing'

/* The owner's pricing rule, set 2026-08-12:
   one base price per unit per package covering up to 10 guests, then ₱300 for
   every chargeable guest above 10. If these numbers ever stop matching what the
   resort actually charges, these tests should fail. */

const INCLUDED = 10

const CASITA_BANDS: RateBand[] = [
  { package: 'DAY_TOUR', minPax: 1, maxPax: INCLUDED, price: 6000 },
  { package: 'NIGHT_TOUR', minPax: 1, maxPax: INCLUDED, price: 6500 },
  { package: 'FULL_STAY', minPax: 1, maxPax: INCLUDED, price: 12000 },
]

const GAZEBO_BANDS: RateBand[] = [
  { package: 'DAY_TOUR', minPax: 1, maxPax: INCLUDED, price: 3500 },
  { package: 'NIGHT_TOUR', minPax: 1, maxPax: INCLUDED, price: 4500 },
  { package: 'FULL_STAY', minPax: 1, maxPax: INCLUDED, price: 8000 },
]

const base = {
  extraGuestFee: 300,
  extensionHours: 0,
  addOns: [],
  depositPercent: 30,
}

const casita = { ...base, unitId: 'casita' as const, bands: CASITA_BANDS, extensionRatePerHour: 500 }
const gazebo = { ...base, unitId: 'gazebo' as const, bands: GAZEBO_BANDS, extensionRatePerHour: 300 }

describe('base rates, up to 10 guests', () => {
  it('prices the casita', () => {
    expect(quote({ ...casita, package: 'DAY_TOUR', paxTotal: 8, paxUnder4: 0 }).total).toBe(6000)
    expect(quote({ ...casita, package: 'NIGHT_TOUR', paxTotal: 8, paxUnder4: 0 }).total).toBe(6500)
    expect(quote({ ...casita, package: 'FULL_STAY', paxTotal: 10, paxUnder4: 0 }).total).toBe(12000)
  })

  it('prices the gazebo', () => {
    expect(quote({ ...gazebo, package: 'DAY_TOUR', paxTotal: 10, paxUnder4: 0 }).total).toBe(3500)
    expect(quote({ ...gazebo, package: 'NIGHT_TOUR', paxTotal: 10, paxUnder4: 0 }).total).toBe(4500)
    expect(quote({ ...gazebo, package: 'FULL_STAY', paxTotal: 10, paxUnder4: 0 }).total).toBe(8000)
  })

  it('charges the base rate for a single guest, because the unit is booked whole', () => {
    expect(quote({ ...gazebo, package: 'DAY_TOUR', paxTotal: 1, paxUnder4: 0 }).total).toBe(3500)
  })

  it('refuses to guess when a package has no rate at all', () => {
    expect(() =>
      quote({ ...casita, bands: [], package: 'DAY_TOUR', paxTotal: 4, paxUnder4: 0 }),
    ).toThrow(PricingError)
  })
})

describe('₱300 a head above ten', () => {
  it('adds per head on both units and every package', () => {
    expect(quote({ ...casita, package: 'DAY_TOUR', paxTotal: 11, paxUnder4: 0 }).total).toBe(6300)
    expect(quote({ ...casita, package: 'FULL_STAY', paxTotal: 14, paxUnder4: 0 }).total).toBe(13200)
    expect(quote({ ...gazebo, package: 'NIGHT_TOUR', paxTotal: 12, paxUnder4: 0 }).total).toBe(5100)
  })

  it('closes the 11-15 gap the gazebo card never priced', () => {
    // This was an open question in CONTENT-GAPS. It now has one answer.
    expect(quote({ ...gazebo, package: 'DAY_TOUR', paxTotal: 12, paxUnder4: 0 }).total).toBe(4100)
    expect(quote({ ...gazebo, package: 'FULL_STAY', paxTotal: 15, paxUnder4: 0 }).total).toBe(9500)
  })

  it('reproduces the printed casita card at the headcounts where the card was consistent', () => {
    // The old card quoted 7,500 day and 8,000 night for "11-20 pax". The
    // per-head rule lands exactly there at 15 guests.
    expect(quote({ ...casita, package: 'DAY_TOUR', paxTotal: 15, paxUnder4: 0 }).total).toBe(7500)
    expect(quote({ ...casita, package: 'NIGHT_TOUR', paxTotal: 15, paxUnder4: 0 }).total).toBe(8000)
    // ...and the card's 15,000 full stay lands at 20 guests.
    expect(quote({ ...casita, package: 'FULL_STAY', paxTotal: 20, paxUnder4: 0 }).total).toBe(15000)
  })

  it('shows the overflow as its own line so the guest can see the maths', () => {
    const result = quote({ ...casita, package: 'DAY_TOUR', paxTotal: 16, paxUnder4: 0 })
    const line = result.lines.find((l) => l.key === 'extra-guests')
    expect(line?.amount).toBe(1800)
    expect(line?.label).toBe('6 extra guests')
  })

  it('adds no overflow line at exactly ten', () => {
    const result = quote({ ...casita, package: 'FULL_STAY', paxTotal: 10, paxUnder4: 0 })
    expect(result.lines.some((l) => l.key === 'extra-guests')).toBe(false)
  })
})

describe('children under four', () => {
  it('does not charge for them', () => {
    const withKids = quote({ ...casita, package: 'DAY_TOUR', paxTotal: 12, paxUnder4: 4 })
    expect(withKids.chargeableGuests).toBe(8)
    expect(withKids.total).toBe(6000)
  })

  it('keeps a large family under the per-head threshold', () => {
    // 14 people, 4 of them toddlers: 10 chargeable, so no extra-guest fee.
    const result = quote({ ...gazebo, package: 'FULL_STAY', paxTotal: 14, paxUnder4: 4 })
    expect(result.total).toBe(8000)
  })

  it('rejects more children than guests', () => {
    expect(() => quote({ ...casita, package: 'DAY_TOUR', paxTotal: 3, paxUnder4: 5 })).toThrow(
      PricingError,
    )
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
    expect(result.depositDue).toBe(1800)
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
  it('returns the only band there is', () => {
    expect(selectBand(CASITA_BANDS, 'DAY_TOUR', 4).price).toBe(6000)
    expect(selectBand(CASITA_BANDS, 'DAY_TOUR', 40).price).toBe(6000)
  })
})
