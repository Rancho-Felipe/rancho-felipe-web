import { describe, expect, it } from 'vitest'
import { guestHoldReceipt, type BookingEmailData } from './templates'

const BANK = {
  gcash: '0995-333-9526',
  maya: '0995-333-9526',
  bpi: '4059412499 BB',
  name: 'Ralph Ivan Simeon',
}

const booking: BookingEmailData = {
  reference: 'RF-C-2026-0001',
  unitId: 'casita',
  unitName: 'The Private Casita',
  packageLabel: '22-hour stay',
  checkInAt: new Date('2026-09-01T06:00:00.000Z'),
  checkOutAt: new Date('2026-09-02T04:00:00.000Z'),
  guestName: 'Maria Santos',
  guestEmail: 'maria@example.com',
  guestPhone: '0917-000-0000',
  guestAddress: 'Teresa, Rizal',
  paxTotal: 10,
  paxUnder4: 0,
  pets: 0,
  extensionHours: 0,
  lines: [{ label: '22-hour stay', amount: 12000 }],
  total: 12000,
  depositDue: 3600,
  balanceDue: 8400,
  holdExpiresAt: new Date('2026-08-16T06:00:00.000Z'),
  status: 'PENDING',
}

/* The account numbers must disappear the moment card payment goes live. An
   email is the worst place for them to linger: it sits in an inbox long after
   the site has changed, and a guest who transfers by hand to a booking the
   checkout already settled has to be refunded by a person. */
describe('deposit instructions in the hold receipt', () => {
  it('lists the account numbers while manual payment is the only option', () => {
    const message = guestHoldReceipt(booking, BANK)

    expect(message.html).toContain('0995-333-9526')
    expect(message.html).toContain('4059412499 BB')
    expect(message.html).toContain('Upload your receipt')
    expect(message.text).toContain('0995-333-9526')
  })

  it('publishes no account numbers once online payment is live', () => {
    const message = guestHoldReceipt(booking, null)

    for (const secret of [BANK.gcash, BANK.maya, BANK.bpi, BANK.name]) {
      expect(message.html).not.toContain(secret)
      expect(message.text).not.toContain(secret)
    }
  })

  it('sends the guest to the payment page instead of a receipt upload', () => {
    const message = guestHoldReceipt(booking, null)

    expect(message.html).toContain('/book/RF-C-2026-0001')
    expect(message.html).not.toContain('Upload your receipt')
    expect(message.text).not.toContain('upload your receipt')
  })

  it('still names the amount owed, so the guest knows before clicking', () => {
    const message = guestHoldReceipt(booking, null)

    expect(message.html).toContain('3,600')
    expect(message.text).toContain('3,600')
  })
})
