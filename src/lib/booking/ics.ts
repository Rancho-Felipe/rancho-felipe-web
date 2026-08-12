import { createEvent, type EventAttributes } from 'ics'

/* Calendar files, used two ways:

   - attached to the guest's receipt, so the stay lands in their phone calendar
   - served per unit at /api/ical/[unit].ics, so Airbnb can import our direct
     bookings and stop selling dates we have already sold

   Times are written as UTC arrays. The ics library treats a plain array as
   floating local time, which would land an hour or eight out depending on where
   the guest's phone is, so every timestamp here goes through the UTC form. */

function toUtcArray(date: Date): [number, number, number, number, number] {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ]
}

export interface CalendarBooking {
  reference: string
  unitName: string
  checkInAt: Date
  checkOutAt: Date
  guestName?: string
  guests?: number
  status?: string
}

const PRODUCT_ID = '-//Rancho Felipe//Booking//EN'

export function bookingToEvent(booking: CalendarBooking, options?: { forPublicFeed?: boolean }): EventAttributes {
  const publicFeed = options?.forPublicFeed ?? false

  return {
    productId: PRODUCT_ID,
    // Stable per booking, so re-importing updates rather than duplicating.
    uid: `${booking.reference}@ranchofelipe.ph`,
    start: toUtcArray(booking.checkInAt),
    startInputType: 'utc',
    end: toUtcArray(booking.checkOutAt),
    endInputType: 'utc',
    title: publicFeed
      ? // Airbnb only needs to know the dates are gone. Guest names and group
        // sizes are none of its business.
        `Booked — ${booking.unitName}`
      : `${booking.unitName} — Rancho Felipe`,
    description: publicFeed
      ? `Reference ${booking.reference}`
      : [
          `Reference: ${booking.reference}`,
          booking.guests ? `Guests: ${booking.guests}` : null,
          '',
          'Rancho Felipe, Maximiano Compound, Brgy. Dalig, Teresa, Rizal.',
          'The last stretch of road is rough but passable for cars and vans.',
        ]
          .filter(Boolean)
          .join('\n'),
    location: 'Rancho Felipe, Brgy. Dalig, Teresa, Rizal, Philippines',
    geo: { lat: 14.5788535, lon: 121.2345648 },
    status: booking.status === 'CONFIRMED' ? 'CONFIRMED' : 'TENTATIVE',
    busyStatus: 'BUSY',
  }
}

/** One booking, for the guest's own calendar. */
export function bookingIcs(booking: CalendarBooking): string | null {
  const { error, value } = createEvent(bookingToEvent(booking))
  if (error || !value) {
    console.error('Could not build calendar file', error)
    return null
  }
  return value
}

/**
 * A whole feed, hand-assembled.
 *
 * The ics package's multi-event helper rewrites the product id and drops the
 * calendar-level name that Airbnb shows in its UI, so the wrapper is written
 * here and each event is generated individually.
 */
export function feedIcs(unitName: string, bookings: CalendarBooking[]): string {
  const events = bookings
    .map((booking) => {
      const { error, value } = createEvent(bookingToEvent(booking, { forPublicFeed: true }))
      if (error || !value) return null
      // Strip each event's own calendar wrapper; keep only the VEVENT block.
      const match = value.match(/BEGIN:VEVENT[\s\S]*END:VEVENT/)
      return match ? match[0] : null
    })
    .filter((event): event is string => event !== null)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODUCT_ID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Rancho Felipe — ${unitName}`,
    'X-WR-TIMEZONE:Asia/Manila',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}
