import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/* The alert on the owner's Today screen is only useful if it means something.
   These tests pin the rule that decides when it fires, because it silently
   stopped matching reality once before: the age limit was written for a job
   that ran twice an hour, the Hobby plan forced the job down to once a day, and
   the limit stayed at 12 hours — so every healthy feed was reported broken for
   half of every day. */

const findMany = vi.fn(async (_args: { where: Record<string, any> }) => [])

vi.mock('@/lib/db', () => ({ db: { icalFeed: { findMany } } }))

beforeEach(() => {
  findMany.mockClear()
  vi.useFakeTimers()
  // Evening on purpose. The old 12-hour rule looked fine at noon and only began
  // crying wolf in the afternoon, which is exactly why it went unnoticed.
  vi.setSystemTime(new Date('2026-08-16T20:00:00+08:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

/** The cutoff the query was built with. */
async function cutoffFor(hours?: number): Promise<Date> {
  const { stalefeeds } = await import('./ical-import')
  await (hours === undefined ? stalefeeds() : stalefeeds(hours))
  const where = findMany.mock.calls[0][0].where
  return where.OR.find((clause: Record<string, unknown>) => 'lastOkAt' in clause && clause.lastOkAt)
    .lastOkAt.lt
}

describe('deciding a calendar feed needs attention', () => {
  it('tolerates a full day between runs, because that is the schedule', async () => {
    const cutoff = await cutoffFor()
    const hoursAllowed = (Date.now() - cutoff.getTime()) / 3_600_000

    // Daily job, and the Hobby plan may fire it anywhere within the hour, so a
    // healthy feed can legitimately be just over 25 hours old.
    expect(hoursAllowed).toBeGreaterThan(25)
  })

  it('does not flag a feed that imported this morning', async () => {
    const thisMorning = new Date('2026-08-16T04:30:00+08:00')

    // The exact case from the owner's screenshot: both units imported fine at
    // 4:30 AM and the alert was showing anyway.
    expect(thisMorning.getTime()).toBeGreaterThan((await cutoffFor()).getTime())

    // And the proof this is a regression test rather than a restatement of the
    // current value: the old 12-hour rule would have flagged that same feed.
    findMany.mockClear()
    expect(thisMorning.getTime()).toBeLessThan((await cutoffFor(12)).getTime())
  })

  it('still flags a feed that has missed more than a day', async () => {
    const cutoff = await cutoffFor()
    const twoDaysAgo = new Date('2026-08-14T12:00:00+08:00')

    expect(twoDaysAgo.getTime()).toBeLessThan(cutoff.getTime())
  })

  it('flags a feed that has never imported', async () => {
    const { stalefeeds } = await import('./ical-import')
    await stalefeeds()

    expect(findMany.mock.calls[0][0].where.OR).toContainEqual({ lastOkAt: null })
  })

  /* A feed erroring right now should not have to age for a day first. */
  it('flags a feed whose last attempt failed, however recent', async () => {
    const { stalefeeds } = await import('./ical-import')
    await stalefeeds()

    expect(findMany.mock.calls[0][0].where.OR).toContainEqual({ failureCount: { gt: 0 } })
  })

  it('only ever considers feeds that are switched on', async () => {
    const { stalefeeds } = await import('./ical-import')
    await stalefeeds()

    expect(findMany.mock.calls[0][0].where.active).toBe(true)
  })
})
