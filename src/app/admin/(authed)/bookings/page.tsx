import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { inResortTime } from '@/lib/booking/schedule'
import { peso } from '@/lib/content'
import type { Prisma } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Bookings', robots: { index: false } }
export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'text-stone',
  AWAITING_VERIFICATION: 'text-brick-lift',
  CONFIRMED: 'text-field-lift',
  COMPLETED: 'text-stone',
  EXPIRED: 'text-stone/60',
  CANCELLED: 'text-stone/60',
  REJECTED: 'text-stone/60',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Unpaid',
  AWAITING_VERIFICATION: 'Check receipt',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Stayed',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'AWAITING_VERIFICATION', label: 'Check receipt' },
  { key: 'PENDING', label: 'Unpaid' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'upcoming', label: 'Upcoming' },
]

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const params = await searchParams
  const query = (params.q ?? '').trim()
  const status = params.status ?? 'all'

  const where: Prisma.BookingWhereInput = {}

  if (status === 'upcoming') {
    where.checkInAt = { gte: new Date() }
    where.status = { in: ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED'] }
  } else if (status !== 'all') {
    where.status = status as never
  }

  if (query) {
    where.OR = [
      { reference: { contains: query, mode: 'insensitive' } },
      { guestName: { contains: query, mode: 'insensitive' } },
      { guestEmail: { contains: query, mode: 'insensitive' } },
      { guestPhone: { contains: query } },
    ]
  }

  const bookings = await db.booking.findMany({
    where,
    include: { unit: true },
    orderBy: { checkInAt: 'desc' },
    take: 200,
  })

  const exportHref = `/api/admin/bookings/export${status !== 'all' ? `?status=${status}` : ''}`

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-title font-display">Bookings</h1>
        <a
          href={exportHref}
          className="ml-auto rounded-full border border-stone/40 px-4 py-2 text-sm text-paper hover:border-stone"
        >
          Download CSV
        </a>
      </div>

      <form className="mt-6 flex flex-wrap gap-3" action="/admin/bookings">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Reference, name, email or number"
          className="min-w-[16rem] flex-1 rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
        />
        <input type="hidden" name="status" value={status} />
        <button
          type="submit"
          className="rounded-full bg-pool px-5 py-2.5 text-sm font-medium text-paper"
        >
          Search
        </button>
      </form>

      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Filter bookings">
        {FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={`/admin/bookings?status=${filter.key}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              status === filter.key
                ? 'border-pool bg-night-raised text-paper'
                : 'border-night-edge text-stone hover:border-stone/50'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {bookings.length === 0 ? (
        <p className="mt-10 text-sm text-stone">Nothing here yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left">
            <thead>
              <tr className="border-b hairline">
                {['Reference', 'Unit', 'Guest', 'Check in', 'Guests', 'Total', 'Status'].map(
                  (heading) => (
                    <th key={heading} scope="col" className="eyebrow py-3 pr-4 font-normal">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b hairline hover:bg-night-raised">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/bookings/${booking.reference}`}
                      className="font-data text-sm text-paper underline-offset-4 hover:underline"
                    >
                      {booking.reference}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-sm text-stone">{booking.unit.shortName}</td>
                  <td className="py-3 pr-4 text-sm text-paper">{booking.guestName}</td>
                  <td className="py-3 pr-4 font-data text-sm text-stone">
                    {inResortTime(booking.checkInAt, 'd MMM yyyy HH:mm')}
                  </td>
                  <td className="py-3 pr-4 font-data text-sm text-stone">{booking.paxTotal}</td>
                  <td className="py-3 pr-4 font-data text-sm text-stone">{peso(booking.total)}</td>
                  <td className={`py-3 pr-4 text-sm ${STATUS_STYLE[booking.status] ?? 'text-stone'}`}>
                    {STATUS_LABEL[booking.status] ?? booking.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
