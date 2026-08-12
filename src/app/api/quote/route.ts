import { NextResponse } from 'next/server'
import { priceSelection, availableAddOns } from '@/lib/booking/quote-service'
import { quoteInput, validateGuestMix } from '@/lib/booking/schema'
import { getAvailability } from '@/lib/booking/availability'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Prices a selection and says whether it is still bookable.
 *
 * Both answers come from the database on every call. The price shown in the
 * browser is a preview — the booking endpoint recomputes it and can refuse.
 */
export async function POST(request: Request) {
  const limited = await rateLimit(request, { key: 'quote', limit: 60, windowMs: 60_000 })
  if (limited) return limited

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Send a JSON body.' }, { status: 400 })
  }

  const parsed = quoteInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const mixError = validateGuestMix(parsed.data.guests, parsed.data.under4)
  if (mixError) return NextResponse.json({ error: mixError }, { status: 400 })

  try {
    const [priced, addOns, availability] = await Promise.all([
      priceSelection(parsed.data),
      availableAddOns(parsed.data.unit, parsed.data.package),
      getAvailability({
        unitId: parsed.data.unit,
        from: parsed.data.date,
        to: parsed.data.date,
      }),
    ])

    const state = availability[0]?.slots[parsed.data.package] ?? 'taken'

    return NextResponse.json({
      state,
      available: state === 'free',
      checkInAt: priced.checkInAt.toISOString(),
      checkOutAt: priced.checkOutAt.toISOString(),
      maxGuests: priced.maxGuests,
      overCapacity: priced.overCapacity,
      addOns,
      quote: {
        lines: priced.quote.lines,
        total: priced.quote.total,
        depositDue: priced.quote.depositDue,
        balanceDue: priced.quote.balanceDue,
        chargeableGuests: priced.quote.chargeableGuests,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not price that.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
