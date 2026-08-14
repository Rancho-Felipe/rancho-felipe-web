import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

/* PayMongo is the one thing mocked here — reaching their sandbox from a test
   run would make the suite depend on someone else's uptime. Everything else is
   the real database, because what is being tested is whether a booking gets
   confirmed, and that is a database fact. */
const readCheckout = vi.fn()
vi.mock('@/lib/payments/paymongo', () => ({
  readCheckout: (...args: unknown[]) => readCheckout(...args),
  payMongoConfigured: () => true,
  PayMongoError: class extends Error {},
}))

// Email is fire-and-forget in production; silenced here so a missing API key
// cannot colour the result.
vi.mock('@/lib/email/notify', () => ({
  notifyConfirmed: vi.fn().mockResolvedValue(undefined),
  notifyNewBooking: vi.fn().mockResolvedValue(undefined),
  notifyProofUploaded: vi.fn().mockResolvedValue(undefined),
  houseRulesForGuests: () => [],
}))

const { db } = await import('@/lib/db')
const { settleBooking } = await import('@/lib/payments/settle')
const { createBooking } = await import('@/lib/booking/create')

const TEST_EMAIL = 'settle-test@example.invalid'

const guest = {
  guestName: 'Settle Test',
  guestEmail: TEST_EMAIL,
  guestPhone: '0900-000-0000',
  guestAddress: 'Test',
  paxTotal: 6,
  paxUnder4: 0,
  pets: 0,
  extensionHours: 0,
  addOnIds: [] as string[],
}

async function clean() {
  await db.booking.deleteMany({ where: { guestEmail: TEST_EMAIL } })
}

/** A booking with a PayMongo session waiting on it, as the checkout route leaves it. */
async function bookingAwaitingPayment(date: string) {
  const booking = await createBooking({
    ...guest,
    unitId: 'casita',
    package: 'DAY_TOUR',
    date,
  })
  const row = await db.booking.findUnique({ where: { reference: booking.reference } })
  await db.payment.create({
    data: {
      bookingId: row!.id,
      method: 'PAYMONGO',
      status: 'PENDING',
      amount: row!.depositDue,
      providerId: 'cs_test_123',
      providerUrl: 'https://checkout.paymongo.com/test',
    },
  })
  return row!
}

beforeEach(async () => {
  readCheckout.mockReset()
  await clean()
})

afterAll(async () => {
  await clean()
  await db.$disconnect()
})

describe('settling a PayMongo payment', () => {
  it('confirms the booking when PayMongo says it was paid in full', async () => {
    const booking = await bookingAwaitingPayment('2028-03-04')
    readCheckout.mockResolvedValue({
      paid: true,
      amountPaid: booking.depositDue,
      reference: booking.reference,
      paymentIds: ['pay_123'],
    })

    const outcome = await settleBooking(booking.reference)
    expect(outcome.status).toBe('confirmed')

    const after = await db.booking.findUnique({ where: { id: booking.id } })
    expect(after?.status).toBe('CONFIRMED')
    expect(after?.confirmedAt).not.toBeNull()
    // A confirmed booking must never expire out from under the guest.
    expect(after?.holdExpiresAt).toBeNull()
  })

  it('refuses to confirm when PayMongo says it is not paid', async () => {
    const booking = await bookingAwaitingPayment('2028-03-06')
    readCheckout.mockResolvedValue({
      paid: false,
      amountPaid: 0,
      reference: booking.reference,
      paymentIds: [],
    })

    expect((await settleBooking(booking.reference)).status).toBe('unpaid')
    const after = await db.booking.findUnique({ where: { id: booking.id } })
    expect(after?.status).toBe('PENDING')
  })

  it('refuses to confirm an underpayment, and says by how much', async () => {
    // The case that matters: a session whose amount was tampered with before
    // payment. Confirming this would hand over a weekend for a fraction of it.
    const booking = await bookingAwaitingPayment('2028-03-08')
    readCheckout.mockResolvedValue({
      paid: true,
      amountPaid: 1,
      reference: booking.reference,
      paymentIds: ['pay_short'],
    })

    const outcome = await settleBooking(booking.reference)
    expect(outcome.status).toBe('underpaid')
    if (outcome.status === 'underpaid') {
      expect(outcome.expected).toBe(booking.depositDue)
      expect(outcome.received).toBe(1)
    }

    const after = await db.booking.findUnique({ where: { id: booking.id } })
    expect(after?.status).toBe('PENDING')
  })

  it('is safe to run twice — the webhook and the guest returning both call it', async () => {
    const booking = await bookingAwaitingPayment('2028-03-10')
    readCheckout.mockResolvedValue({
      paid: true,
      amountPaid: booking.depositDue,
      reference: booking.reference,
      paymentIds: ['pay_123'],
    })

    expect((await settleBooking(booking.reference)).status).toBe('confirmed')
    expect((await settleBooking(booking.reference)).status).toBe('already-confirmed')

    // Exactly one verified payment, not two.
    const payments = await db.payment.findMany({
      where: { bookingId: booking.id, status: 'VERIFIED' },
    })
    expect(payments).toHaveLength(1)
  })

  it('does not ask PayMongo anything when no session was ever started', async () => {
    const booking = await createBooking({
      ...guest,
      unitId: 'gazebo',
      package: 'DAY_TOUR',
      date: '2028-03-12',
    })

    expect((await settleBooking(booking.reference)).status).toBe('no-session')
    expect(readCheckout).not.toHaveBeenCalled()
  })

  it('reports an unknown reference rather than throwing', async () => {
    expect((await settleBooking('RF-C-1999-0001')).status).toBe('not-found')
  })
})
