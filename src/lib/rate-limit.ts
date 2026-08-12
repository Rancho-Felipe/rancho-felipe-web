import { NextResponse } from 'next/server'

/* ---------------------------------------------------------------------------
   A small in-memory rate limiter for the booking and contact endpoints.

   Deliberately simple: this resort takes a handful of bookings a week, not
   thousands a second. The job is to stop someone hammering the booking form or
   scraping the calendar, not to survive a botnet.

   The counter lives in the process, so on a platform that runs several
   instances each one keeps its own tally and the effective limit is higher.
   That is an acceptable trade at this size. If the site ever needs a shared
   limit, swap the Map for Redis behind the same function signature.
--------------------------------------------------------------------------- */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Keeps the Map from growing forever on a long-lived server. */
function sweep(now: number) {
  if (buckets.size < 5_000) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

function clientKey(request: Request): string {
  // Vercel and most proxies set these. Falls back to a constant, which means an
  // unknown client shares one bucket — stricter, not looser.
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function rateLimit(
  request: Request,
  options: { key: string; limit: number; windowMs: number },
): Promise<NextResponse | null> {
  const now = Date.now()
  sweep(now)

  const id = `${options.key}:${clientKey(request)}`
  const existing = buckets.get(id)

  if (!existing || existing.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + options.windowMs })
    return null
  }

  existing.count += 1

  if (existing.count > options.limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  return null
}
