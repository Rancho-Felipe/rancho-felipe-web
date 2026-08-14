import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { rateLimit } from '@/lib/rate-limit'
import { createCheckout, payMongoConfigured, PayMongoError } from '@/lib/payments/paymongo'

export const dynamic = 'force-dynamic'

const input = z.object({ reference: z.string().trim().min(6).max(32) })

/**
 * Starts an online payment: creates a PayMongo hosted checkout for the deposit
 * and hands back the link to send the guest to.
 *
 * The amount comes from the booking row, never from the request. A guest cannot
 * ask to pay less than they owe by editing what the browser sends.
 */
export async function POST(request: Request) {
  const limited = await rateLimit(request, { key: 'paymongo', limit: 12, windowMs: 10 * 60_000 })
  if (limited) return limited

  const settings = await getSettings()
  if (!settings.paymentMethods.paymongo || !payMongoConfigured()) {
    return NextResponse.json(
      { error: 'Card and e-wallet payment is not switched on. Please send the deposit manually.' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Send a JSON body.' }, { status: 400 })
  }

  const parsed = input.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const booking = await db.booking.findUnique({
    where: { reference: parsed.data.reference.toUpperCase() },
    include: { unit: true, payments: true },
  })
  if (!booking) return NextResponse.json({ error: 'No such booking.' }, { status: 404 })

  if (booking.status !== 'PENDING') {
    return NextResponse.json(
      { error: 'This booking is not waiting for a payment.' },
      { status: 409 },
    )
  }

  // Reuse an unfinished session rather than opening a second one — two live
  // sessions on one booking is how a guest ends up paying twice.
  const existing = booking.payments.find(
    (payment) => payment.method === 'PAYMONGO' && payment.status === 'PENDING' && payment.providerUrl,
  )
  if (existing?.providerUrl) {
    return NextResponse.json({ checkoutUrl: existing.providerUrl, reused: true })
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin

  try {
    const checkout = await createCheckout({
      reference: booking.reference,
      guestEmail: booking.guestEmail,
      guestName: booking.guestName,
      description: `${booking.unit.name} — deposit for ${booking.reference}`,
      lines: [
        {
          name: `${booking.unit.name} deposit`,
          pesos: booking.depositDue,
          description: `Booking ${booking.reference}. Balance of ₱${booking.balanceDue.toLocaleString('en-PH')} on arrival.`,
        },
      ],
      successUrl: `${site}/book/${booking.reference}?paid=1`,
      cancelUrl: `${site}/book/${booking.reference}?cancelled=1`,
    })

    await db.payment.create({
      data: {
        bookingId: booking.id,
        method: 'PAYMONGO',
        status: 'PENDING',
        amount: booking.depositDue,
        providerId: checkout.sessionId,
        providerUrl: checkout.checkoutUrl,
      },
    })

    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl })
  } catch (error) {
    if (error instanceof PayMongoError) {
      console.error('PayMongo refused a checkout', error.message)
      return NextResponse.json(
        { error: 'Could not start the online payment. You can still send the deposit manually.' },
        { status: 502 },
      )
    }
    throw error
  }
}
