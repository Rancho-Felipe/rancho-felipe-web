import { NextResponse } from 'next/server'
import { bookingInput, validateGuestMix } from '@/lib/booking/schema'
import { createBooking, SlotTakenError, BookingRejected } from '@/lib/booking/create'
import { PricingError } from '@/lib/booking/pricing'
import { notifyNewBooking } from '@/lib/email/notify'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Creates a booking and holds the dates.
 *
 * Nothing about the price arrives from the browser. The body carries what the
 * guest chose; every peso is recomputed here from the database, and the dates
 * are held by a Postgres exclusion constraint rather than by this code.
 */
export async function POST(request: Request) {
  // Tighter than the read endpoints: this one writes.
  const limited = await rateLimit(request, { key: 'booking', limit: 8, windowMs: 10 * 60_000 })
  if (limited) return limited

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Send a JSON body.' }, { status: 400 })
  }

  const parsed = bookingInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // Honeypot. A real guest never sees this field, so anything in it is a bot.
  // Answer as though it worked, so the bot has nothing to learn.
  if (parsed.data.website) {
    return NextResponse.json({ reference: 'RF-0000-0000', ok: true }, { status: 201 })
  }

  const mixError = validateGuestMix(parsed.data.guests, parsed.data.under4)
  if (mixError) return NextResponse.json({ error: mixError }, { status: 400 })

  try {
    const booking = await createBooking({
      unitId: parsed.data.unit,
      package: parsed.data.package,
      date: parsed.data.date,
      paxTotal: parsed.data.guests,
      paxUnder4: parsed.data.under4,
      pets: parsed.data.pets,
      extensionHours: parsed.data.extensionHours,
      addOnIds: parsed.data.addOnIds,
      guestName: parsed.data.name,
      guestEmail: parsed.data.email,
      guestPhone: parsed.data.phone,
      guestAddress: parsed.data.address,
      guestNote: parsed.data.note,
    })

    // After the commit, and deliberately not awaited. The guest is mid-redirect
    // and a mail outage must not cost them the booking they just made.
    void notifyNewBooking(booking.id).catch((cause) =>
      console.error('Booking saved but notification failed', cause),
    )

    return NextResponse.json(
      {
        reference: booking.reference,
        checkInAt: booking.checkInAt.toISOString(),
        checkOutAt: booking.checkOutAt.toISOString(),
        total: booking.quote.total,
        depositDue: booking.quote.depositDue,
        balanceDue: booking.quote.balanceDue,
      },
      { status: 201 },
    )
  } catch (error) {
    // 409 rather than 400: the request was fine, the world moved.
    if (error instanceof SlotTakenError) {
      return NextResponse.json({ error: error.message, slotTaken: true }, { status: 409 })
    }
    if (error instanceof BookingRejected || error instanceof PricingError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Booking failed', error)
    return NextResponse.json(
      { error: 'Something went wrong on our side. Please try again, or message us to book.' },
      { status: 500 },
    )
  }
}
