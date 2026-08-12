import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { createBooking, SlotTakenError } from '@/lib/booking/create'
import { inResortTime } from '@/lib/booking/schedule'

/* ---------------------------------------------------------------------------
   The double-booking tests.

   These run against a real Postgres — PGlite locally, the hosted database in
   CI — because the guarantee being tested is a Postgres exclusion constraint,
   not application logic. Mocking the database here would test nothing.

   Dates are far in the future so the same-day cutoff never interferes, and
   every test cleans up after itself.
--------------------------------------------------------------------------- */

const TEST_EMAIL = 'overlap-test@example.invalid'

const guest = {
  guestName: 'Overlap Test',
  guestEmail: TEST_EMAIL,
  guestPhone: '0900-000-0000',
  guestAddress: 'Test',
  paxTotal: 8,
  paxUnder4: 0,
  pets: 0,
  extensionHours: 0,
  addOnIds: [] as string[],
}

async function clean() {
  await db.booking.deleteMany({ where: { guestEmail: TEST_EMAIL } })
  await db.calendarBlock.deleteMany({ where: { reason: 'overlap-test' } })
}

beforeEach(clean)
afterAll(async () => {
  await clean()
  await db.$disconnect()
})

describe('one unit cannot be sold twice', () => {
  it('refuses an identical second booking', async () => {
    const slot = { unitId: 'casita' as const, package: 'DAY_TOUR' as const, date: '2027-03-10' }

    const first = await createBooking({ ...guest, ...slot })
    expect(first.reference).toMatch(/^RF-C-2027-\d{4}$/)

    await expect(createBooking({ ...guest, ...slot })).rejects.toBeInstanceOf(SlotTakenError)
  })

  it('lets exactly one of ten simultaneous attempts win', async () => {
    const slot = { unitId: 'casita' as const, package: 'FULL_STAY' as const, date: '2027-04-01' }

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => createBooking({ ...guest, ...slot })),
    )

    const won = results.filter((r) => r.status === 'fulfilled')
    const lost = results.filter((r) => r.status === 'rejected')

    expect(won).toHaveLength(1)
    expect(lost).toHaveLength(9)
    // Every loser must get the guest-facing error, not a raw database failure.
    for (const result of lost) {
      expect((result as PromiseRejectedResult).reason).toBeInstanceOf(SlotTakenError)
    }

    // And the database agrees there is only one.
    const stored = await db.booking.count({
      where: { guestEmail: TEST_EMAIL, unitId: 'casita' },
    })
    expect(stored).toBe(1)
  })

  it('never hands two bookings the same reference', async () => {
    const results = await Promise.all([
      createBooking({ ...guest, unitId: 'casita', package: 'DAY_TOUR', date: '2027-05-01' }),
      createBooking({ ...guest, unitId: 'casita', package: 'DAY_TOUR', date: '2027-05-02' }),
      createBooking({ ...guest, unitId: 'casita', package: 'DAY_TOUR', date: '2027-05-03' }),
    ])
    const references = new Set(results.map((r) => r.reference))
    expect(references.size).toBe(3)
  })
})

describe('the three check-in windows', () => {
  it('allows a night tour and the next morning day tour', async () => {
    // Night tour ends 06:00, day tour starts 07:00. The hour between them is
    // exactly the turnover buffer, so both are sellable.
    const night = await createBooking({
      ...guest,
      unitId: 'casita',
      package: 'NIGHT_TOUR',
      date: '2027-06-10',
    })
    expect(inResortTime(night.checkOutAt, 'yyyy-MM-dd HH:mm')).toBe('2027-06-11 06:00')

    const day = await createBooking({
      ...guest,
      unitId: 'casita',
      package: 'DAY_TOUR',
      date: '2027-06-11',
    })
    expect(inResortTime(day.checkInAt, 'yyyy-MM-dd HH:mm')).toBe('2027-06-11 07:00')
  })

  it('refuses a day tour on the morning a full stay is checking out', async () => {
    // Full stay runs to 12:00 on the 12th; a day tour would start 07:00 that
    // same morning, while the previous group is still in the unit.
    await createBooking({
      ...guest,
      unitId: 'casita',
      package: 'FULL_STAY',
      date: '2027-07-11',
    })

    await expect(
      createBooking({ ...guest, unitId: 'casita', package: 'DAY_TOUR', date: '2027-07-12' }),
    ).rejects.toBeInstanceOf(SlotTakenError)
  })

  it('allows a night tour on the evening a full stay checks out', async () => {
    await createBooking({
      ...guest,
      unitId: 'casita',
      package: 'FULL_STAY',
      date: '2027-08-11',
    })
    // Checkout is 12:00; the night tour starts 20:00. Eight hours clear.
    const night = await createBooking({
      ...guest,
      unitId: 'casita',
      package: 'NIGHT_TOUR',
      date: '2027-08-12',
    })
    expect(night.reference).toMatch(/^RF-C-/)
  })
})

describe('the two calendars are independent', () => {
  it('lets the gazebo take the slot the casita just sold', async () => {
    const date = '2027-09-05'
    await createBooking({ ...guest, unitId: 'casita', package: 'DAY_TOUR', date })

    const gazebo = await createBooking({ ...guest, unitId: 'gazebo', package: 'DAY_TOUR', date })
    expect(gazebo.reference).toMatch(/^RF-G-2027-\d{4}$/)
  })
})

describe('blocked dates', () => {
  it('refuses a booking that lands on a date the owner closed', async () => {
    await db.calendarBlock.create({
      data: {
        unitId: 'gazebo',
        startAt: new Date('2027-10-01T00:00:00+08:00'),
        endAt: new Date('2027-10-03T00:00:00+08:00'),
        source: 'MANUAL',
        reason: 'overlap-test',
      },
    })

    await expect(
      createBooking({ ...guest, unitId: 'gazebo', package: 'DAY_TOUR', date: '2027-10-02' }),
    ).rejects.toBeInstanceOf(SlotTakenError)

    // ...and the day after the block ends is still free.
    const after = await createBooking({
      ...guest,
      unitId: 'gazebo',
      package: 'DAY_TOUR',
      date: '2027-10-03',
    })
    expect(after.reference).toBeTruthy()
  })
})

describe('cancelled bookings release their dates', () => {
  it('lets a new guest take the slot once the first is cancelled', async () => {
    const slot = { unitId: 'gazebo' as const, package: 'FULL_STAY' as const, date: '2027-11-20' }
    const first = await createBooking({ ...guest, ...slot })

    await expect(createBooking({ ...guest, ...slot })).rejects.toBeInstanceOf(SlotTakenError)

    await db.booking.update({
      where: { id: first.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    })

    const second = await createBooking({ ...guest, ...slot })
    expect(second.reference).not.toBe(first.reference)
  })
})
