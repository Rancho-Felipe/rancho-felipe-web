import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import {
  WINDOWS,
  holdWindow,
  resolveWindow,
  resortDate,
  type PackageKey,
} from '@/lib/booking/schedule'

/* ---------------------------------------------------------------------------
   Reading availability.

   Rule that shapes everything here: never show a date as free unless the
   database says so. This never guesses, never falls back to "probably fine",
   and never trusts anything the browser sends. If a calendar feed has failed
   and we might be missing an Airbnb booking, the admin is warned rather than
   the guest being sold a date that is gone.
--------------------------------------------------------------------------- */

export type SlotState =
  /** Bookable right now. */
  | 'free'
  /** Someone else has it, or the owner closed it. */
  | 'taken'
  /** Already happened. */
  | 'past'
  /** Too close to check-in to book online. */
  | 'cutoff'

export interface DayAvailability {
  date: string
  slots: Record<Exclude<PackageKey, 'CUSTOM'>, SlotState>
  /** True when nothing at all is bookable that day. */
  fullyBooked: boolean
}

interface Interval {
  from: number
  to: number
}

const LIVE_STATUSES = ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED'] as const
const PACKAGES = ['DAY_TOUR', 'NIGHT_TOUR', 'FULL_STAY'] as const

function overlaps(a: Interval, list: Interval[]): boolean {
  // Half-open on both sides, matching the database constraint exactly. Touching
  // is not overlapping — that is what lets a night tour hand over to a day tour.
  return list.some((b) => a.from < b.to && a.to > b.from)
}

function eachDate(from: string, to: string): string[] {
  const dates: string[] = []
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const cursor = new Date(Date.UTC(fy, fm - 1, fd))
  const end = new Date(Date.UTC(ty, tm - 1, td))
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

export async function getAvailability(options: {
  unitId: 'casita' | 'gazebo'
  /** Inclusive, yyyy-MM-dd in Philippine time. */
  from: string
  to: string
  now?: Date
}): Promise<DayAvailability[]> {
  const now = options.now ?? new Date()
  const settings = await getSettings()

  const dates = eachDate(options.from, options.to)
  if (dates.length === 0) return []

  // Widen the query by a day at each end: a night tour starting on the day
  // before the range still occupies the morning of the first day in it.
  const rangeStart = resolveWindow(dates[0], 'DAY_TOUR').checkInAt.getTime() - 48 * 3_600_000
  const rangeEnd =
    resolveWindow(dates[dates.length - 1], 'FULL_STAY').checkOutAt.getTime() + 48 * 3_600_000

  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: {
        unitId: options.unitId,
        heldFrom: { lt: new Date(rangeEnd) },
        heldUntil: { gt: new Date(rangeStart) },
        // A pending hold whose window has run out no longer reserves anything,
        // even if the sweeper has not reached it yet. Reading and writing agree
        // on this: createBooking clears the same rows inside its transaction.
        OR: [
          { status: { in: ['AWAITING_VERIFICATION', 'CONFIRMED'] } },
          { status: 'PENDING', holdExpiresAt: { gt: now } },
          { status: 'PENDING', holdExpiresAt: null },
        ],
      },
      select: { heldFrom: true, heldUntil: true },
    }),
    db.calendarBlock.findMany({
      where: {
        unitId: options.unitId,
        startAt: { lt: new Date(rangeEnd) },
        endAt: { gt: new Date(rangeStart) },
      },
      select: { startAt: true, endAt: true },
    }),
  ])

  const busy: Interval[] = [
    ...bookings.map((b) => ({ from: b.heldFrom.getTime(), to: b.heldUntil.getTime() })),
    ...blocks.map((b) => ({ from: b.startAt.getTime(), to: b.endAt.getTime() })),
  ]

  const cutoffMs = settings.sameDayCutoffHours * 3_600_000

  return dates.map((date) => {
    const slots = {} as Record<Exclude<PackageKey, 'CUSTOM'>, SlotState>

    for (const pkg of PACKAGES) {
      const stay = resolveWindow(date, pkg)
      const held = holdWindow(stay, settings.turnoverMinutes)

      if (stay.checkInAt.getTime() <= now.getTime()) {
        slots[pkg] = 'past'
      } else if (stay.checkInAt.getTime() - now.getTime() < cutoffMs) {
        slots[pkg] = 'cutoff'
      } else if (
        overlaps({ from: held.heldFrom.getTime(), to: held.heldUntil.getTime() }, busy)
      ) {
        slots[pkg] = 'taken'
      } else {
        slots[pkg] = 'free'
      }
    }

    return {
      date,
      slots,
      fullyBooked: PACKAGES.every((pkg) => slots[pkg] !== 'free'),
    }
  })
}

/**
 * What the site map asks for: the state of both units on one date, with the
 * price of each bookable window.
 */
export interface UnitDayView {
  unitId: 'casita' | 'gazebo'
  slots: Array<{
    package: Exclude<PackageKey, 'CUSTOM'>
    label: string
    checkIn: string
    checkOut: string
    state: SlotState
    price: number | null
  }>
  anyFree: boolean
}

export async function getDayView(
  date: string,
  guests: number,
  now?: Date,
): Promise<UnitDayView[]> {
  const units = await db.unit.findMany({
    include: { ratePlans: true },
    orderBy: { sortOrder: 'asc' },
  })

  const views = await Promise.all(
    units.map(async (unit) => {
      const [day] = await getAvailability({
        unitId: unit.id as 'casita' | 'gazebo',
        from: date,
        to: date,
        now,
      })

      const slots = PACKAGES.map((pkg) => {
        const window = WINDOWS[pkg]
        const candidates = unit.ratePlans
          .filter((plan) => plan.package === pkg)
          .sort((a, b) => a.maxPax - b.maxPax)
        const plan = candidates.find((p) => guests <= p.maxPax) ?? candidates.at(-1)

        return {
          package: pkg,
          label: window.label,
          checkIn: `${String(window.startHour).padStart(2, '0')}:00`,
          checkOut: `${String(window.endHour).padStart(2, '0')}:00`,
          state: day?.slots[pkg] ?? 'taken',
          price: plan?.price ?? null,
        }
      })

      return {
        unitId: unit.id as 'casita' | 'gazebo',
        slots,
        anyFree: slots.some((slot) => slot.state === 'free'),
      }
    }),
  )

  return views
}

/** Today in Philippine time — the earliest date a calendar should offer. */
export function firstBookableDate(now = new Date()): string {
  return resortDate(now)
}
