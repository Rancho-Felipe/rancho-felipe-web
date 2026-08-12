import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { inResortTime, resortDate } from '@/lib/booking/schedule'
import { blockDates, unblockDates } from '@/lib/admin/actions'

export const metadata: Metadata = { title: 'Calendar', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const today = resortDate(new Date())

  const [units, blocks, upcoming] = await Promise.all([
    db.unit.findMany({ orderBy: { sortOrder: 'asc' } }),
    db.calendarBlock.findMany({
      where: { endAt: { gte: new Date() } },
      include: { unit: true },
      orderBy: { startAt: 'asc' },
    }),
    db.booking.findMany({
      where: {
        checkOutAt: { gte: new Date() },
        status: { in: ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED'] },
      },
      include: { unit: true },
      orderBy: { checkInAt: 'asc' },
      take: 60,
    }),
  ])

  async function block(formData: FormData) {
    'use server'
    await blockDates(
      String(formData.get('unitId')),
      String(formData.get('startDate')),
      String(formData.get('endDate')),
      String(formData.get('reason') ?? ''),
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-title font-display">Calendar</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        Close dates when the resort isn&apos;t taking guests. Anything you close here also goes out
        on the Airbnb feed, so it can&apos;t be booked there either.
      </p>

      {/* --- close dates --------------------------------------------------- */}
      <section className="mt-8 rounded-2xl border border-night-edge bg-night-raised p-6">
        <h2 className="font-display text-lg">Close some dates</h2>
        <form action={block} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <label className="block">
            <span className="eyebrow block">Which unit</span>
            <select
              name="unitId"
              required
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="eyebrow block">From</span>
            <input
              type="date"
              name="startDate"
              defaultValue={today}
              min={today}
              required
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
            />
          </label>

          <label className="block">
            <span className="eyebrow block">To</span>
            <input
              type="date"
              name="endDate"
              defaultValue={today}
              min={today}
              required
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
            />
          </label>

          <label className="block lg:col-span-1">
            <span className="eyebrow block">Why</span>
            <input
              name="reason"
              placeholder="Repairs, family use…"
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
            />
          </label>

          <button
            type="submit"
            className="rounded-full bg-pool px-5 py-2.5 text-sm font-medium text-paper"
          >
            Close these dates
          </button>
        </form>
      </section>

      {/* --- closed dates --------------------------------------------------- */}
      <section className="mt-10">
        <h2 className="font-display text-lg">Closed dates</h2>
        {blocks.length === 0 ? (
          <p className="mt-3 text-sm text-stone">Nothing closed. Every date is open for booking.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-night-edge px-4 py-3"
              >
                <span className="text-sm text-paper">{block.unit.shortName}</span>
                <span className="font-data text-sm text-stone">
                  {inResortTime(block.startAt, 'd MMM')} → {inResortTime(block.endAt, 'd MMM yyyy')}
                </span>
                <span className="text-sm text-stone">{block.reason}</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    block.source === 'AIRBNB_ICAL'
                      ? 'border-brick/50 text-brick-lift'
                      : 'border-night-edge text-stone'
                  }`}
                >
                  {block.source === 'AIRBNB_ICAL' ? 'from Airbnb' : 'closed by you'}
                </span>

                {block.source === 'MANUAL' && (
                  <form
                    action={async () => {
                      'use server'
                      await unblockDates(block.id)
                    }}
                    className="ml-auto"
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-stone/40 px-4 py-1.5 text-sm text-paper hover:border-stone"
                    >
                      Reopen
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- what's booked --------------------------------------------------- */}
      <section className="mt-10">
        <h2 className="font-display text-lg">Coming up</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-stone">No bookings ahead.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {upcoming.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/admin/bookings/${booking.reference}`}
                  className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-night-edge px-4 py-3 hover:border-stone/50"
                >
                  <span className="font-data text-sm text-stone">
                    {inResortTime(booking.checkInAt, 'd MMM HH:mm')}
                  </span>
                  <span className="text-sm text-paper">{booking.guestName}</span>
                  <span className="text-sm text-stone">{booking.unit.shortName}</span>
                  <span className="ml-auto font-data text-xs text-stone">{booking.reference}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
