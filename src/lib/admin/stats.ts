import { db } from '@/lib/db'
import { resortDate } from '@/lib/booking/schedule'
import { stalefeeds } from '@/lib/booking/ical-import'

/* What the owner needs to see when they open the page on their phone in the
   morning, in the order they need it. */

function manilaDayBounds(isoDate: string): { start: Date; end: Date } {
  return {
    start: new Date(`${isoDate}T00:00:00+08:00`),
    end: new Date(`${isoDate}T23:59:59.999+08:00`),
  }
}

function monthBounds(now: Date): { start: Date; end: Date } {
  const today = resortDate(now)
  const [year, month] = today.split('-').map(Number)
  const start = new Date(`${today.slice(0, 7)}-01T00:00:00+08:00`)
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`
  const end = new Date(`${nextMonth}-01T00:00:00+08:00`)
  return { start, end }
}

export async function dashboardData(now = new Date()) {
  const today = resortDate(now)
  const { start, end } = manilaDayBounds(today)
  const month = monthBounds(now)

  const [arrivals, departures, awaiting, pending, monthBookings, feeds, occupancyRows] =
    await Promise.all([
      db.booking.findMany({
        where: {
          checkInAt: { gte: start, lte: end },
          status: { in: ['CONFIRMED', 'AWAITING_VERIFICATION'] },
        },
        include: { unit: true },
        orderBy: { checkInAt: 'asc' },
      }),
      db.booking.findMany({
        where: {
          checkOutAt: { gte: start, lte: end },
          status: { in: ['CONFIRMED', 'AWAITING_VERIFICATION'] },
        },
        include: { unit: true },
        orderBy: { checkOutAt: 'asc' },
      }),
      // The queue that actually needs the owner's hands.
      db.booking.findMany({
        where: { status: 'AWAITING_VERIFICATION' },
        include: { unit: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { updatedAt: 'asc' },
      }),
      db.booking.count({ where: { status: 'PENDING' } }),
      db.booking.findMany({
        where: {
          checkInAt: { gte: month.start, lt: month.end },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
        select: { total: true, depositDue: true, unitId: true, checkInAt: true, checkOutAt: true },
      }),
      stalefeeds(12),
      db.unit.findMany({ select: { id: true, name: true } }),
    ])

  const revenue = monthBookings.reduce((sum, booking) => sum + booking.total, 0)
  const deposits = monthBookings.reduce((sum, booking) => sum + booking.depositDue, 0)

  // Occupancy as nights sold against nights available, per unit, this month.
  const daysInMonth = Math.round((month.end.getTime() - month.start.getTime()) / 86_400_000)
  const occupancy = occupancyRows.map((unit) => {
    const days = new Set<string>()
    for (const booking of monthBookings.filter((b) => b.unitId === unit.id)) {
      const cursor = new Date(booking.checkInAt)
      while (cursor < booking.checkOutAt) {
        days.add(resortDate(cursor))
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
    }
    return {
      unitId: unit.id,
      unitName: unit.name,
      daysBooked: days.size,
      percent: daysInMonth === 0 ? 0 : Math.round((days.size / daysInMonth) * 100),
    }
  })

  return {
    today,
    arrivals,
    departures,
    awaiting,
    pendingCount: pending,
    revenue,
    deposits,
    bookingsThisMonth: monthBookings.length,
    occupancy,
    staleFeeds: feeds,
  }
}
