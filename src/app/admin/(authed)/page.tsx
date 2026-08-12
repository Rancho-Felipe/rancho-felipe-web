import type { Metadata } from 'next'
import Link from 'next/link'
import { dashboardData } from '@/lib/admin/stats'
import { inResortTime } from '@/lib/booking/schedule'
import { peso } from '@/lib/content'

export const metadata: Metadata = { title: 'Today', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  const data = await dashboardData()

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-title font-display">Today</h1>
      <p className="mt-2 font-data text-sm text-stone">{data.today}</p>

      {/* A broken calendar feed is the one thing that can cause two groups to
          turn up on the same day, so it shouts before anything else. */}
      {data.staleFeeds.length > 0 && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-brick bg-night-raised px-5 py-4"
        >
          <h2 className="font-display text-base text-brick-lift">Calendar sync needs attention</h2>
          <ul className="mt-2 space-y-1 text-sm text-stone">
            {data.staleFeeds.map((feed) => (
              <li key={feed.id}>
                <span className="text-paper">{feed.unitId}</span> — last successful import{' '}
                {feed.lastOkAt ? inResortTime(feed.lastOkAt) : 'never'}.
                {feed.lastError && <span className="block text-xs">{feed.lastError}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-stone">
            Until this clears, Airbnb bookings may not be blocking dates here. Check those dates by
            hand before confirming anything.
          </p>
        </div>
      )}

      {/* --- the queue ---------------------------------------------------- */}
      <section className="mt-8">
        <h2 className="font-display text-lg">
          Waiting on you{' '}
          {data.awaiting.length > 0 && (
            <span className="ml-1 rounded-full bg-brick px-2.5 py-0.5 font-data text-xs text-paper">
              {data.awaiting.length}
            </span>
          )}
        </h2>

        {data.awaiting.length === 0 ? (
          <p className="mt-3 text-sm text-stone">
            No receipts to check. {data.pendingCount > 0 && `${data.pendingCount} still unpaid.`}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.awaiting.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/admin/bookings/${booking.reference}`}
                  className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-night-edge bg-night-raised px-5 py-4 hover:border-stone/50"
                >
                  <span className="font-data text-sm text-paper">{booking.reference}</span>
                  <span className="text-sm text-stone">{booking.unit.shortName}</span>
                  <span className="text-sm text-paper">{booking.guestName}</span>
                  <span className="font-data text-sm text-stone">
                    {inResortTime(booking.checkInAt, 'd MMM')}
                  </span>
                  <span className="ml-auto font-data text-sm text-brick-lift">
                    {peso(booking.depositDue)} to check
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- arrivals and departures --------------------------------------- */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Panel title="Arriving today" empty="Nobody arriving.">
          {data.arrivals.map((booking) => (
            <Row
              key={booking.id}
              reference={booking.reference}
              unit={booking.unit.shortName}
              name={booking.guestName}
              time={inResortTime(booking.checkInAt, 'HH:mm')}
              detail={`${booking.paxTotal} guests · ${peso(booking.balanceDue)} to collect`}
            />
          ))}
        </Panel>

        <Panel title="Leaving today" empty="Nobody leaving.">
          {data.departures.map((booking) => (
            <Row
              key={booking.id}
              reference={booking.reference}
              unit={booking.unit.shortName}
              name={booking.guestName}
              time={inResortTime(booking.checkOutAt, 'HH:mm')}
              detail={`${booking.paxTotal} guests`}
            />
          ))}
        </Panel>
      </div>

      {/* --- the month ------------------------------------------------------ */}
      <section className="mt-10">
        <h2 className="font-display text-lg">This month</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Confirmed bookings" value={String(data.bookingsThisMonth)} />
          <Stat label="Booked value" value={peso(data.revenue)} />
          <Stat label="Deposits taken" value={peso(data.deposits)} />
          {data.occupancy.map((unit) => (
            <Stat
              key={unit.unitId}
              label={`${unit.unitName} occupancy`}
              value={`${unit.percent}%`}
              note={`${unit.daysBooked} days`}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function Panel({
  title,
  empty,
  children,
}: {
  title: string
  empty: string
  children: React.ReactNode
}) {
  const items = Array.isArray(children) ? children : [children]
  const hasItems = items.filter(Boolean).length > 0

  return (
    <section className="rounded-xl border border-night-edge bg-night-raised p-5">
      <h3 className="font-display text-base">{title}</h3>
      {hasItems ? <ul className="mt-3 space-y-3">{children}</ul> : <p className="mt-2 text-sm text-stone">{empty}</p>}
    </section>
  )
}

function Row({
  reference,
  unit,
  name,
  time,
  detail,
}: {
  reference: string
  unit: string
  name: string
  time: string
  detail: string
}) {
  return (
    <li className="border-b hairline pb-3 last:border-b-0 last:pb-0">
      <Link href={`/admin/bookings/${reference}`} className="block hover:text-paper">
        <span className="flex items-baseline gap-3">
          <span className="font-data text-sm text-paper">{time}</span>
          <span className="text-sm text-paper">{name}</span>
          <span className="ml-auto text-xs text-stone">{unit}</span>
        </span>
        <span className="mt-0.5 block text-xs text-stone">{detail}</span>
      </Link>
    </li>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-night-edge bg-night-raised p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-data text-xl text-paper">{value}</p>
      {note && <p className="mt-0.5 text-xs text-stone">{note}</p>}
    </div>
  )
}
