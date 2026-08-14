import { db } from '@/lib/db'
import { readCheckout } from '@/lib/payments/paymongo'
import { notifyConfirmed } from '@/lib/email/notify'

/* Turning a PayMongo payment into a confirmed booking.

   Called from two places that must agree: the webhook, and the guest landing
   back on their booking page after paying. Whichever happens first does the
   work; the second finds it already done and changes nothing. That is what
   makes a lost webhook survivable — the guest's own return finishes the job. */

export type SettleOutcome =
  | { status: 'confirmed'; reference: string }
  | { status: 'already-confirmed'; reference: string }
  | { status: 'unpaid'; reference: string }
  | { status: 'underpaid'; reference: string; expected: number; received: number }
  | { status: 'no-session'; reference: string }
  | { status: 'not-found'; reference: string }

export async function settleBooking(reference: string): Promise<SettleOutcome> {
  const booking = await db.booking.findUnique({
    where: { reference: reference.toUpperCase() },
    include: { payments: { orderBy: { createdAt: 'desc' } } },
  })
  if (!booking) return { status: 'not-found', reference }

  if (booking.status === 'CONFIRMED') {
    return { status: 'already-confirmed', reference: booking.reference }
  }

  const pending = booking.payments.find(
    (payment) => payment.method === 'PAYMONGO' && payment.providerId,
  )
  if (!pending?.providerId) return { status: 'no-session', reference: booking.reference }

  // The authority. Not the webhook body, not a query string — PayMongo, asked
  // directly with our own secret key.
  const state = await readCheckout(pending.providerId)
  if (!state.paid) return { status: 'unpaid', reference: booking.reference }

  // Guard against a session whose amount was tampered with before payment, and
  // against partial captures. Confirming a booking that was underpaid would
  // hand over a weekend for less than it costs.
  if (state.amountPaid + 0.01 < pending.amount) {
    await db.auditLog.create({
      data: {
        action: 'payment.underpaid',
        entity: 'booking',
        entityId: booking.id,
        actorName: 'paymongo',
        meta: { expected: pending.amount, received: state.amountPaid },
      },
    })
    return {
      status: 'underpaid',
      reference: booking.reference,
      expected: pending.amount,
      received: state.amountPaid,
    }
  }

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: pending.id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        amount: Math.round(state.amountPaid),
        reference: state.paymentIds[0] ?? pending.reference,
      },
    })
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date(), holdExpiresAt: null },
    })
    await tx.auditLog.create({
      data: {
        action: 'payment.settled',
        entity: 'booking',
        entityId: booking.id,
        actorName: 'paymongo',
        meta: { sessionId: pending.providerId, amount: state.amountPaid },
      },
    })
  })

  void notifyConfirmed(booking.id).catch((cause) =>
    console.error('Confirmed by PayMongo but could not email the guest', cause),
  )

  return { status: 'confirmed', reference: booking.reference }
}
