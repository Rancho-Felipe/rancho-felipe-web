import { db } from '@/lib/db'
import { feedIcs } from '@/lib/booking/ics'

/* The outbound half of calendar sync: Airbnb subscribes to this and stops
   selling dates we have already sold directly.

   Accepts /api/ical/casita and /api/ical/casita.ics — Airbnb's importer is
   happier with a URL that ends in .ics, and both spellings land here. */

export const dynamic = 'force-dynamic'

const LIVE = ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED'] as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ unit: string }> },
) {
  const { unit: raw } = await params
  const unitId = raw.replace(/\.ics$/i, '').toLowerCase()

  const unit = await db.unit.findUnique({ where: { id: unitId } })
  if (!unit) {
    return new Response('Unknown unit', { status: 404 })
  }

  // A year back and two forward. Airbnb only cares about the future, and the
  // past keeps the feed useful for anyone auditing it.
  const from = new Date(Date.now() - 365 * 86_400_000)
  const to = new Date(Date.now() + 730 * 86_400_000)

  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: {
        unitId,
        status: { in: [...LIVE] },
        // Never export what we imported, or Airbnb sees its own bookings
        // reflected back and the two calendars argue.
        source: { not: 'AIRBNB_ICAL' },
        checkOutAt: { gte: from },
        checkInAt: { lte: to },
      },
      select: { reference: true, checkInAt: true, checkOutAt: true, status: true },
      orderBy: { checkInAt: 'asc' },
    }),
    db.calendarBlock.findMany({
      where: {
        unitId,
        source: 'MANUAL',
        endAt: { gte: from },
        startAt: { lte: to },
      },
      select: { id: true, startAt: true, endAt: true, reason: true },
      orderBy: { startAt: 'asc' },
    }),
  ])

  const events = [
    ...bookings.map((booking) => ({
      reference: booking.reference,
      unitName: unit.name,
      checkInAt: booking.checkInAt,
      checkOutAt: booking.checkOutAt,
      status: booking.status,
    })),
    // Dates the owner closed by hand also have to go out, or Airbnb will sell
    // a day the resort has deliberately shut.
    ...blocks.map((block) => ({
      reference: `BLOCK-${block.id}`,
      unitName: unit.name,
      checkInAt: block.startAt,
      checkOutAt: block.endAt,
      status: 'CONFIRMED',
    })),
  ]

  return new Response(feedIcs(unit.name, events), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="rancho-felipe-${unitId}.ics"`,
      // Airbnb polls this on its own schedule; a short cache keeps repeated
      // pulls cheap without letting the feed go stale.
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
