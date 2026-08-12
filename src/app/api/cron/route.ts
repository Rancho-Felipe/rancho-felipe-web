import { NextResponse } from 'next/server'
import { expireStaleHolds } from '@/lib/booking/expire'
import { importAllFeeds } from '@/lib/booking/ical-import'

/* Scheduled work, in one endpoint.
   On Vercel, drive it from vercel.json:

     { "crons": [{ "path": "/api/cron", "schedule": "0,30 * * * *" }] }

   Anywhere else, curl it from cron with the same header. */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  // Refuse rather than run wide open. An unprotected job endpoint is a way to
  // make the server do work for anyone who finds the URL.
  if (!secret) return false

  const header = request.headers.get('authorization')
  if (header === `Bearer ${secret}`) return true

  // Vercel Cron sends this header on its own scheduled invocations.
  return request.headers.get('x-vercel-cron') !== null && process.env.VERCEL === '1'
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 })
  }

  const startedAt = Date.now()

  const [holds, feeds] = await Promise.all([
    expireStaleHolds().catch((cause) => {
      console.error('Hold expiry failed', cause)
      return { expired: 0, references: [], error: String(cause) }
    }),
    importAllFeeds().catch((cause) => {
      console.error('Calendar import failed', cause)
      return [] as Awaited<ReturnType<typeof importAllFeeds>>
    }),
  ])

  const failures = feeds.filter((feed) => !feed.ok)
  if (failures.length > 0) {
    // Loud on purpose. A silent import failure is how a resort ends up with two
    // groups on the same date.
    console.error(
      'Calendar feeds failed to import:',
      failures.map((feed) => `${feed.unitId}: ${feed.error}`).join(' | '),
    )
  }

  return NextResponse.json({
    ok: failures.length === 0,
    tookMs: Date.now() - startedAt,
    holdsExpired: holds.expired,
    feeds,
  })
}
