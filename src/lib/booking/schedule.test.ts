import { describe, expect, it } from 'vitest'
import { resolveWindow, holdWindow, inResortTime, resortDate } from '@/lib/booking/schedule'

/* Philippine time is UTC+8 all year, so every expected instant below is the
   local time minus eight hours. Written out in full rather than computed, so a
   mistake in the code cannot quietly agree with a mistake in the test. */

describe('resolveWindow', () => {
  it('runs a day tour 07:00 to 17:00 on the same date', () => {
    const w = resolveWindow('2026-08-14', 'DAY_TOUR')
    expect(w.checkInAt.toISOString()).toBe('2026-08-13T23:00:00.000Z') // 14th 07:00 +08
    expect(w.checkOutAt.toISOString()).toBe('2026-08-14T09:00:00.000Z') // 14th 17:00 +08
  })

  it('carries a night tour past midnight into the next morning', () => {
    const w = resolveWindow('2026-08-14', 'NIGHT_TOUR')
    expect(w.checkInAt.toISOString()).toBe('2026-08-14T12:00:00.000Z') // 14th 20:00 +08
    expect(w.checkOutAt.toISOString()).toBe('2026-08-14T22:00:00.000Z') // 15th 06:00 +08
    expect(inResortTime(w.checkOutAt, 'yyyy-MM-dd HH:mm')).toBe('2026-08-15 06:00')
  })

  it('runs a full stay 14:00 to noon the next day, which is 22 hours', () => {
    const w = resolveWindow('2026-08-14', 'FULL_STAY')
    expect(inResortTime(w.checkInAt, 'yyyy-MM-dd HH:mm')).toBe('2026-08-14 14:00')
    expect(inResortTime(w.checkOutAt, 'yyyy-MM-dd HH:mm')).toBe('2026-08-15 12:00')

    const hours = (w.checkOutAt.getTime() - w.checkInAt.getTime()) / 3_600_000
    expect(hours).toBe(22)
  })

  it('handles a booking that crosses a month boundary', () => {
    const w = resolveWindow('2026-08-31', 'FULL_STAY')
    expect(inResortTime(w.checkOutAt, 'yyyy-MM-dd HH:mm')).toBe('2026-09-01 12:00')
  })

  it('handles a booking that crosses a year boundary', () => {
    const w = resolveWindow('2026-12-31', 'NIGHT_TOUR')
    expect(inResortTime(w.checkOutAt, 'yyyy-MM-dd HH:mm')).toBe('2027-01-01 06:00')
  })

  it('handles a leap day', () => {
    const w = resolveWindow('2028-02-28', 'FULL_STAY')
    expect(inResortTime(w.checkOutAt, 'yyyy-MM-dd HH:mm')).toBe('2028-02-29 12:00')
  })
})

describe('holdWindow', () => {
  it('pads the stay at both ends by the turnover buffer', () => {
    const stay = resolveWindow('2026-08-14', 'DAY_TOUR')
    const held = holdWindow(stay, 60)
    expect(inResortTime(held.heldFrom, 'HH:mm')).toBe('06:00')
    expect(inResortTime(held.heldUntil, 'HH:mm')).toBe('18:00')
  })

  it('leaves a night tour and the next morning day tour just clear of each other', () => {
    // This is the pair the owner asked about: night ends 06:00, day starts 07:00.
    const night = holdWindow(resolveWindow('2026-08-14', 'NIGHT_TOUR'), 30)
    const day = holdWindow(resolveWindow('2026-08-15', 'DAY_TOUR'), 30)

    // Night hold ends 06:30, day hold starts 06:30. Half-open ranges, so they
    // touch without overlapping and both are bookable.
    expect(night.heldUntil.getTime()).toBe(day.heldFrom.getTime())
    expect(night.heldUntil.getTime() <= day.heldFrom.getTime()).toBe(true)
  })

  it('makes the pair collide once the buffer is larger than the gap', () => {
    const night = holdWindow(resolveWindow('2026-08-14', 'NIGHT_TOUR'), 60)
    const day = holdWindow(resolveWindow('2026-08-15', 'DAY_TOUR'), 60)
    // 60 minutes each side eats the whole hour between them, so they overlap.
    expect(night.heldUntil.getTime() > day.heldFrom.getTime()).toBe(true)
  })

  it('pushes checkout out when extra hours are bought', () => {
    const stay = resolveWindow('2026-08-14', 'DAY_TOUR')
    const held = holdWindow(stay, 60, 3)
    expect(inResortTime(held.checkOutAt, 'HH:mm')).toBe('20:00')
    expect(inResortTime(held.heldUntil, 'HH:mm')).toBe('21:00')
  })
})

describe('resortDate', () => {
  it('reports the Philippine date even when UTC has already moved on', () => {
    // 2026-08-14 23:30 UTC is already the 15th in Manila.
    expect(resortDate(new Date('2026-08-14T23:30:00Z'))).toBe('2026-08-15')
    // ...and 16:00 UTC is midnight Manila, the boundary itself.
    expect(resortDate(new Date('2026-08-14T16:00:00Z'))).toBe('2026-08-15')
    expect(resortDate(new Date('2026-08-14T15:59:00Z'))).toBe('2026-08-14')
  })
})
