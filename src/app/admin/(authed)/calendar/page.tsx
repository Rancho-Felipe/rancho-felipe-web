import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { inResortTime, resortDate } from '@/lib/booking/schedule'
import { getAvailability, type SlotState } from '@/lib/booking/availability'
import { blockDates, unblockDates } from '@/lib/admin/actions'

export const metadata: Metadata = { title: 'Calendar', robots: { index: false } }
export const dynamic = 'force-dynamic'

const PACKAGES = [
  { key: 'DAY_TOUR' as const, label: 'Day tour' },
  { key: 'NIGHT_TOUR' as const, label: 'Night tour' },
  { key: 'FULL_STAY' as const, label: 'Full stay' },
]

/** One dot per check-in method, because a date is never simply free or taken —
 *  a day tour can be sold while the night tour that evening is still open. */
const DOT: Record<SlotState, string> = {
  free: 'bg-field',
  taken: 'bg-brick',
  past: 'bg-night-edge',
  cutoff: 'bg-stone/40',
}

function monthBounds(month: string) {
  const [year, m] = month.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate()
  // Monday-first, matching how a wall calendar is read here.
  const firstWeekday = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7
  return {
    first: `${month}-01`,
    last: `${month}-${String(daysInMonth).padStart(2, '0')}`,
    daysInMonth,
    firstWeekday,
    year,
    m,
  }
}

function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(year, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string; unit?: string }>
}) {
  const params = await searchParams
  const today = resortDate(new Date())
  const month = /^\d{4}-\d{2}$/.test(params.month ?? '') ? params.month! : today.slice(0, 7)
  const bounds = monthBounds(month)

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
      take: 40,
    }),
  ])

  // The same reader the public site uses, so admin and guests can never
  // disagree about whether a date is free.
  const grids = await Promise.all(
    units.map(async (unit) => ({
      unit,
      days: await getAvailability({
        unitId: unit.id as 'casita' | 'gazebo',
        from: bounds.first,
        to: bounds.last,
      }),
    })),
  )

  async function block(formData: FormData) {
    'use server'
    await blockDates(
      String(formData.get('unitId')),
      String(formData.get('startDate')),
      String(formData.get('endDate')),
      String(formData.get('reason') ?? ''),
    )
  }

  const preDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? '') ? params.date! : today
  const preUnit = params.unit === 'gazebo' ? 'gazebo' : 'casita'

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-title font-display">Calendar</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        Green means still bookable, red means taken or closed. Every date carries three dots — day
        tour, night tour, full stay — because one can be sold while the others stay open. Tap a
        date to close it.
      </p>

      {/* --- month navigation ---------------------------------------------- */}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href={`/admin/calendar?month=${shiftMonth(month, -1)}`}
          className="rounded-full border border-night-edge px-4 py-1.5 text-sm text-stone hover:border-stone/60"
        >
          ← Previous
        </Link>
        <p className="font-display text-lg">
          {new Date(Date.UTC(bounds.year, bounds.m - 1, 1)).toLocaleDateString('en-PH', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })}
        </p>
        <Link
          href={`/admin/calendar?month=${shiftMonth(month, 1)}`}
          className="rounded-full border border-night-edge px-4 py-1.5 text-sm text-stone hover:border-stone/60"
        >
          Next →
        </Link>
        {month !== today.slice(0, 7) && (
          <Link href="/admin/calendar" className="text-sm text-pool-lift underline underline-offset-4">
            Back to this month
          </Link>
        )}
      </div>

      {/* --- the grids ------------------------------------------------------ */}
      {grids.map(({ unit, days }) => {
        const byDate = new Map(days.map((day) => [day.date, day]))

        return (
          <section key={unit.id} className="mt-8">
            <h2
              className={`font-display text-lg ${unit.id === 'casita' ? 'text-pool' : 'text-brick'}`}
            >
              {unit.name}
            </h2>

            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                <div key={label} className="eyebrow pb-1 text-center">
                  {label}
                </div>
              ))}

              {Array.from({ length: bounds.firstWeekday }).map((_, index) => (
                <div key={`pad-${index}`} />
              ))}

              {Array.from({ length: bounds.daysInMonth }).map((_, index) => {
                const dayNumber = index + 1
                const date = `${month}-${String(dayNumber).padStart(2, '0')}`
                const day = byDate.get(date)
                const anyFree = day ? Object.values(day.slots).includes('free') : false
                const allPast = day ? Object.values(day.slots).every((s) => s === 'past') : false

                return (
                  <Link
                    key={date}
                    href={`/admin/calendar?month=${month}&date=${date}&unit=${unit.id}#close`}
                    aria-label={`${date} — ${PACKAGES.map((p) => `${p.label} ${day?.slots[p.key] ?? 'unknown'}`).join(', ')}`}
                    // min-h-11 keeps every date at least 44px tall, which is the
                    // smallest thing a thumb reliably hits.
                    className={`min-h-11 rounded-lg border p-1.5 text-center transition-colors ${
                      date === today ? 'border-pool-lift' : 'border-night-edge'
                    } ${allPast ? 'opacity-40' : 'hover:border-stone/60'} ${
                      anyFree ? 'bg-night-raised' : 'bg-night'
                    }`}
                  >
                    <span className="block font-data text-xs text-paper">{dayNumber}</span>
                    <span className="mt-1 flex justify-center gap-0.5">
                      {PACKAGES.map((pkg) => (
                        <span
                          key={pkg.key}
                          className={`h-1.5 w-1.5 rounded-full ${DOT[day?.slots[pkg.key] ?? 'past']}`}
                        />
                      ))}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-stone">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-field" /> bookable
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brick" /> taken or closed
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-stone/40" /> too late to book online
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-night-edge" /> past
        </span>
        <span>Dots read left to right: day tour, night tour, full stay.</span>
      </div>

      {/* --- close dates ----------------------------------------------------- */}
      <section id="close" className="mt-10 rounded-2xl border border-night-edge bg-night-raised p-6">
        <h2 className="font-display text-lg">Close some dates</h2>
        <p className="mt-1 text-sm text-stone">
          Anything closed here also goes out on the Airbnb feed, so it can&apos;t be booked there
          either.
        </p>

        <form action={block} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <label className="block">
            <span className="eyebrow block">Which unit</span>
            <select
              name="unitId"
              defaultValue={preUnit}
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
              defaultValue={preDate}
              required
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
            />
          </label>

          <label className="block">
            <span className="eyebrow block">To</span>
            <input
              type="date"
              name="endDate"
              defaultValue={preDate}
              required
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
            />
          </label>

          <label className="block">
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
                    {inResortTime(booking.checkInAt, 'd MMM, h:mm a')}
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
