import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { inResortTime } from '@/lib/booking/schedule'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

/** Escapes a value for CSV, including the leading-character guard that stops
 *  Excel treating a cell like =1+1 or +63917... as a formula. */
function cell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${guarded.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return new Response('Not authorised', { status: 401 })

  const status = new URL(request.url).searchParams.get('status')
  const where: Prisma.BookingWhereInput = {}
  if (status && status !== 'all' && status !== 'upcoming') {
    where.status = status as never
  } else if (status === 'upcoming') {
    where.checkInAt = { gte: new Date() }
    where.status = { in: ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED'] }
  }

  const bookings = await db.booking.findMany({
    where,
    include: { unit: true },
    orderBy: { checkInAt: 'desc' },
  })

  const headings = [
    'Reference', 'Status', 'Unit', 'Check in', 'Check out', 'Method',
    'Guest', 'Email', 'Phone', 'Address',
    'Guests', 'Under 4', 'Pets', 'Extra hours',
    'Total', 'Deposit', 'Balance', 'Booked on', 'Note',
  ]

  const rows = bookings.map((booking) =>
    [
      booking.reference,
      booking.status,
      booking.unit.name,
      inResortTime(booking.checkInAt, 'yyyy-MM-dd HH:mm'),
      inResortTime(booking.checkOutAt, 'yyyy-MM-dd HH:mm'),
      booking.package,
      booking.guestName,
      booking.guestEmail,
      booking.guestPhone,
      booking.guestAddress,
      booking.paxTotal,
      booking.paxUnder4,
      booking.pets,
      booking.extensionHours,
      booking.total,
      booking.depositDue,
      booking.balanceDue,
      inResortTime(booking.createdAt, 'yyyy-MM-dd HH:mm'),
      booking.guestNote ?? '',
    ]
      .map(cell)
      .join(','),
  )

  // The BOM is what makes Excel read the peso sign and any accented name
  // correctly instead of turning them into mojibake.
  const csv = `﻿${[headings.map(cell).join(','), ...rows].join('\r\n')}`
  const stamp = inResortTime(new Date(), 'yyyy-MM-dd')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rancho-felipe-bookings-${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
