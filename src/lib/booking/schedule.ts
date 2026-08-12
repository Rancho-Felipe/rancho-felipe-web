import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz'
import { addDays } from 'date-fns'

export const RESORT_TIMEZONE = 'Asia/Manila'

export type PackageKey = 'DAY_TOUR' | 'NIGHT_TOUR' | 'FULL_STAY' | 'CUSTOM'

/**
 * The resort's three check-in methods, as the owner set them.
 *
 * These are the reason bookings are stored as timestamps rather than dates. A
 * night tour runs past midnight and a full stay runs to noon the following day,
 * so "which dates are taken" is not a question a date range can answer.
 */
export const WINDOWS: Record<
  Exclude<PackageKey, 'CUSTOM'>,
  { label: string; startHour: number; endHour: number; endsNextDay: boolean; hours: number }
> = {
  DAY_TOUR: { label: 'Day tour', startHour: 7, endHour: 17, endsNextDay: false, hours: 10 },
  NIGHT_TOUR: { label: 'Night tour', startHour: 20, endHour: 6, endsNextDay: true, hours: 10 },
  FULL_STAY: { label: 'Full stay', startHour: 14, endHour: 12, endsNextDay: true, hours: 22 },
}

function atLocalHour(isoDate: string, hour: number): Date {
  const stamp = `${isoDate} ${String(hour).padStart(2, '0')}:00:00`
  return fromZonedTime(stamp, RESORT_TIMEZONE)
}

function shiftIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return formatInTimeZone(
    addDays(new Date(Date.UTC(y, m - 1, d, 12)), days),
    'UTC',
    'yyyy-MM-dd',
  )
}

export interface StayWindow {
  checkInAt: Date
  checkOutAt: Date
}

/**
 * Turns a calendar date plus a check-in method into the two absolute instants
 * the booking actually occupies.
 *
 * `isoDate` is the date the guest ARRIVES, in Philippine time. A night tour
 * booked for the 14th runs 20:00 on the 14th to 06:00 on the 15th.
 */
export function resolveWindow(
  isoDate: string,
  pkg: Exclude<PackageKey, 'CUSTOM'>,
): StayWindow {
  const window = WINDOWS[pkg]
  const checkInAt = atLocalHour(isoDate, window.startHour)
  const checkOutAt = window.endsNextDay
    ? atLocalHour(shiftIsoDate(isoDate, 1), window.endHour)
    : atLocalHour(isoDate, window.endHour)

  return { checkInAt, checkOutAt }
}

/**
 * The window the database actually reserves: the stay widened by the turnover
 * buffer at both ends, so caretakers get time to reset the unit between groups.
 *
 * With the default 60 minutes a night tour ending 06:00 still leaves the 07:00
 * day tour bookable — the buffer meets exactly, and the range is half-open.
 */
export function holdWindow(
  stay: StayWindow,
  turnoverMinutes: number,
  extensionHours = 0,
): { heldFrom: Date; heldUntil: Date; checkOutAt: Date } {
  const ms = turnoverMinutes * 60_000
  const checkOutAt = new Date(stay.checkOutAt.getTime() + extensionHours * 3_600_000)

  return {
    heldFrom: new Date(stay.checkInAt.getTime() - ms),
    heldUntil: new Date(checkOutAt.getTime() + ms),
    checkOutAt,
  }
}

/** Renders an instant in the guest's own timezone — always Philippine time. */
export function inResortTime(value: Date, pattern = "d MMM yyyy 'at' HH:mm"): string {
  return formatInTimeZone(value, RESORT_TIMEZONE, pattern)
}

/** The local calendar date of an instant, for grouping bookings by day. */
export function resortDate(value: Date): string {
  return formatInTimeZone(value, RESORT_TIMEZONE, 'yyyy-MM-dd')
}

/** Today in Philippine time, regardless of where the server is. */
export function todayInResortTime(now = new Date()): string {
  return resortDate(now)
}

/** Guests book from a phone in Manila; the server may be anywhere. */
export function nowInResortTime(now = new Date()): Date {
  return toZonedTime(now, RESORT_TIMEZONE)
}
