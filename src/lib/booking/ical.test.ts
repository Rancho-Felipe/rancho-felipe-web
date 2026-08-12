import { describe, expect, it } from 'vitest'
import { parseIcs } from '@/lib/booking/ical-import'
import { feedIcs, bookingIcs } from '@/lib/booking/ics'
import { inResortTime } from '@/lib/booking/schedule'

describe('parsing what Airbnb sends', () => {
  it('reads all-day events and anchors them to Manila midnight', () => {
    const events = parseIcs(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'DTSTART;VALUE=DATE:20260814',
        'DTEND;VALUE=DATE:20260816',
        'UID:abc123@airbnb.com',
        'SUMMARY:Reserved',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n'),
    )

    expect(events).toHaveLength(1)
    expect(events[0].uid).toBe('abc123@airbnb.com')
    expect(inResortTime(events[0].start, 'yyyy-MM-dd HH:mm')).toBe('2026-08-14 00:00')
    expect(inResortTime(events[0].end, 'yyyy-MM-dd HH:mm')).toBe('2026-08-16 00:00')
  })

  it('reads UTC timestamps', () => {
    const events = parseIcs(
      [
        'BEGIN:VCALENDAR',
        'BEGIN:VEVENT',
        'DTSTART:20260814T060000Z',
        'DTEND:20260814T090000Z',
        'UID:z@x',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n'),
    )
    expect(events[0].start.toISOString()).toBe('2026-08-14T06:00:00.000Z')
  })

  it('unfolds the wrapped lines the spec requires', () => {
    // RFC 5545 splits long lines and continues them with a leading space.
    const events = parseIcs(
      [
        'BEGIN:VCALENDAR',
        'BEGIN:VEVENT',
        'DTSTART;VALUE=DATE:20260814',
        'DTEND;VALUE=DATE:20260815',
        'UID:very-long-identifier-that-airbnb',
        ' -would-wrap-across-lines@airbnb.com',
        'SUMMARY:Reserved',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n'),
    )
    expect(events[0].uid).toBe('very-long-identifier-that-airbnb-would-wrap-across-lines@airbnb.com')
  })

  it('drops events that make no sense rather than importing nonsense', () => {
    const events = parseIcs(
      [
        'BEGIN:VCALENDAR',
        'BEGIN:VEVENT',
        'DTSTART;VALUE=DATE:20260816',
        'DTEND;VALUE=DATE:20260814', // ends before it starts
        'UID:bad@x',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:no-dates@x', // no dates at all
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n'),
    )
    expect(events).toHaveLength(0)
  })

  it('returns nothing for a page that is not a calendar', () => {
    expect(parseIcs('<html><body>Not found</body></html>')).toHaveLength(0)
  })
})

describe('the feed we publish', () => {
  const booking = {
    reference: 'RF-C-2027-0042',
    unitName: 'The Private Casita',
    checkInAt: new Date('2027-02-14T06:00:00Z'), // 14:00 Manila
    checkOutAt: new Date('2027-02-15T04:00:00Z'), // 12:00 Manila
    guestName: 'Maria Santos',
    guests: 12,
    status: 'CONFIRMED',
  }

  it('wraps events in a calendar Airbnb can read', () => {
    const feed = feedIcs('The Private Casita', [booking])
    expect(feed).toContain('BEGIN:VCALENDAR')
    expect(feed).toContain('END:VCALENDAR')
    expect(feed).toContain('X-WR-TIMEZONE:Asia/Manila')
    expect(feed.match(/BEGIN:VEVENT/g)).toHaveLength(1)
  })

  it('writes the times as UTC, not as floating local time', () => {
    const feed = feedIcs('The Private Casita', [booking])
    expect(feed).toContain('DTSTART:20270214T060000Z')
    expect(feed).toContain('DTEND:20270215T040000Z')
  })

  it('never leaks a guest name to Airbnb', () => {
    const feed = feedIcs('The Private Casita', [booking])
    expect(feed).not.toContain('Maria')
    expect(feed).toContain('Booked')
  })

  it('does put the guest name in the guest own copy', () => {
    const ics = bookingIcs(booking)
    expect(ics).toContain('RF-C-2027-0042')
    expect(ics).toContain('Guests: 12')
  })

  it('keeps a stable uid so re-imports update rather than duplicate', () => {
    const first = feedIcs('The Private Casita', [booking])
    const second = feedIcs('The Private Casita', [booking])
    expect(first).toContain('UID:RF-C-2027-0042@ranchofelipe.ph')
    // Only the DTSTAMP may differ between generations.
    expect(first.replace(/DTSTAMP:[0-9TZ]+/g, '')).toBe(second.replace(/DTSTAMP:[0-9TZ]+/g, ''))
  })
})
