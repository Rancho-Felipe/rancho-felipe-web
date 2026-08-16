import { db } from '@/lib/db'

/* ---------------------------------------------------------------------------
   The inbound half of calendar sync.

   This is the failure the brief was most worried about, and rightly: if a feed
   stops importing and nobody notices, the site keeps selling dates that Airbnb
   has already booked, and two groups turn up. So:

     - a fetch failure is recorded on the feed and counted, never swallowed
     - a failing feed does NOT clear the blocks it created last time; stale
       blocks are far safer than absent ones
     - admin surfaces any feed that has not succeeded recently
--------------------------------------------------------------------------- */

export interface ImportResult {
  unitId: string
  ok: boolean
  imported: number
  removed: number
  error?: string
}

/** Minimal iCalendar parser — enough for the VEVENTs Airbnb publishes. */
export function parseIcs(text: string): Array<{ uid: string; start: Date; end: Date; summary: string }> {
  // Unfold: RFC 5545 wraps long lines and continues them with a leading space.
  const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
  const lines = unfolded.split(/\r\n|\n|\r/)

  const events: Array<{ uid: string; start: Date; end: Date; summary: string }> = []
  let current: Record<string, string> | null = null

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      current = {}
      continue
    }
    if (line.startsWith('END:VEVENT')) {
      if (current) {
        const start = parseIcsDate(current.DTSTART)
        const end = parseIcsDate(current.DTEND)
        if (start && end && end > start) {
          events.push({
            uid: current.UID ?? `${start.toISOString()}-${end.toISOString()}`,
            start,
            end,
            summary: current.SUMMARY ?? 'Booked',
          })
        }
      }
      current = null
      continue
    }
    if (!current) continue

    const separator = line.indexOf(':')
    if (separator === -1) continue
    // Strip parameters: "DTSTART;VALUE=DATE" -> "DTSTART"
    const key = line.slice(0, separator).split(';')[0].toUpperCase()
    current[key] = line.slice(separator + 1)
  }

  return events
}

function parseIcsDate(value: string | undefined): Date | null {
  if (!value) return null

  // All-day form: 20260814. Airbnb uses this, and its dates are check-in and
  // check-out days rather than instants, so they are anchored to Manila noon
  // boundaries below.
  const dateOnly = value.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (dateOnly) {
    const [, y, m, d] = dateOnly
    // Midnight Manila is 16:00 UTC the previous day.
    return new Date(`${y}-${m}-${d}T00:00:00+08:00`)
  }

  const withTime = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/)
  if (withTime) {
    const [, y, m, d, hh, mm, ss, zulu] = withTime
    return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}${zulu ? 'Z' : '+08:00'}`)
  }

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : new Date(parsed)
}

export async function importFeed(unitId: string): Promise<ImportResult> {
  const feed = await db.icalFeed.findUnique({ where: { unitId } })
  if (!feed || !feed.active || !feed.url) {
    return { unitId, ok: true, imported: 0, removed: 0 }
  }

  let text: string
  try {
    const response = await fetch(feed.url, {
      headers: { accept: 'text/calendar' },
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Feed returned ${response.status}`)
    text = await response.text()
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('That URL did not return a calendar.')
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : 'Could not fetch the feed.'

    await db.icalFeed.update({
      where: { unitId },
      data: {
        lastFetchedAt: new Date(),
        lastError: error,
        failureCount: { increment: 1 },
      },
    })

    // The existing blocks are deliberately left alone. A feed we cannot read is
    // not evidence that anything became free.
    return { unitId, ok: false, imported: 0, removed: 0, error }
  }

  const events = parseIcs(text)
  const seen = new Set(events.map((event) => event.uid))

  let imported = 0
  for (const event of events) {
    await db.calendarBlock.upsert({
      where: { feedId_externalUid: { feedId: feed.id, externalUid: event.uid } },
      create: {
        unitId,
        startAt: event.start,
        endAt: event.end,
        source: 'AIRBNB_ICAL',
        reason: event.summary.slice(0, 200),
        externalUid: event.uid,
        feedId: feed.id,
      },
      update: {
        startAt: event.start,
        endAt: event.end,
        reason: event.summary.slice(0, 200),
      },
    })
    imported += 1
  }

  // Only now, on a successful read, is it safe to drop blocks the feed no
  // longer lists — those are genuine cancellations on Airbnb's side.
  const stale = await db.calendarBlock.findMany({
    where: { feedId: feed.id, source: 'AIRBNB_ICAL' },
    select: { id: true, externalUid: true },
  })
  const toRemove = stale.filter((block) => block.externalUid && !seen.has(block.externalUid))

  if (toRemove.length > 0) {
    await db.calendarBlock.deleteMany({ where: { id: { in: toRemove.map((b) => b.id) } } })
  }

  await db.icalFeed.update({
    where: { unitId },
    data: {
      lastFetchedAt: new Date(),
      lastOkAt: new Date(),
      lastError: null,
      failureCount: 0,
    },
  })

  return { unitId, ok: true, imported, removed: toRemove.length }
}

export async function importAllFeeds(): Promise<ImportResult[]> {
  const feeds = await db.icalFeed.findMany({ where: { active: true } })
  const results: ImportResult[] = []
  for (const feed of feeds) {
    results.push(await importFeed(feed.unitId))
  }
  return results
}

/** Feeds that have not succeeded in a while, for the admin dashboard to shout about. */
/**
 * Feeds the owner should actually look at.
 *
 * The age limit has to match how often the job really runs. It was 12 hours,
 * set when the schedule was twice an hour. The Hobby plan then forced the job
 * down to once a day, and nobody moved this — so every healthy feed was
 * declared broken for half of each day, on a screen the owner checks each
 * morning. A warning that cries wolf daily is worse than no warning: it trains
 * you to ignore the one morning it matters.
 *
 * 26 hours is the daily schedule (24) plus the hour Hobby may drift by, plus a
 * little room. A feed quiet longer than that has genuinely missed a run.
 *
 * Age is not the only signal. A feed that errored on its last attempt is worth
 * showing immediately, without waiting a day for it to age out — that is a
 * failure the owner can act on now.
 */
export async function stalefeeds(maxAgeHours = 26) {
  const cutoff = new Date(Date.now() - maxAgeHours * 3_600_000)
  return db.icalFeed.findMany({
    where: {
      active: true,
      OR: [
        { lastOkAt: null },
        { lastOkAt: { lt: cutoff } },
        // Last attempt failed, however recently.
        { failureCount: { gt: 0 } },
      ],
    },
  })
}
