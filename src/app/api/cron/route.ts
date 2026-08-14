import { NextResponse } from 'next/server'
import { expireStaleHolds } from '@/lib/booking/expire'
import { importAllFeeds } from '@/lib/booking/ical-import'
import { ensurePayMongoWebhook } from '@/lib/payments/webhook-setup'

/* Scheduled work, in one endpoint. vercel.json drives it; anywhere else, curl
   it from cron with the same header.

   It runs once a day, at 20:00 UTC - 4am in Rizal, the quietest hour. That is
   not the schedule this wants. Twice an hour is. The Hobby plan rejects any
   cron more frequent than daily and fails the entire deployment for it, so
   this is what ships, and Hobby fires it anywhere within that hour.

   Expired holds barely notice. The availability reader already ignores a hold
   past holdExpiresAt, and create.ts releases any dead hold on the window
   before it inserts, so a stale PENDING row neither hides a free slot nor
   blocks a real booking. What this sweep adds is the EXPIRED status and the
   audit trail.

   The Airbnb import is the one that suffers. A booking taken on Airbnb can go
   up to a day before this site hears about it, and in that window the site can
   sell the same slot. The database still refuses a genuine overlap, so it
   surfaces as a booking that has to be turned away rather than two groups at
   the gate - but it is a real gap. Closing it means Pro, or pinging this
   endpoint from outside on a tighter schedule. */

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

  const [holds, feeds, webhook] = await Promise.all([
    expireStaleHolds().catch((cause) => {
      console.error('Hold expiry failed', cause)
      return { expired: 0, references: [], error: String(cause) }
    }),
    importAllFeeds().catch((cause) => {
      console.error('Calendar import failed', cause)
      return [] as Awaited<ReturnType<typeof importAllFeeds>>
    }),
    // Keeps PayMongo pointed here. It does nothing at all until the secret key
    // is set, then registers the webhook the first time it runs — so switching
    // payments on is adding a key and nothing else. It also brings back a
    // webhook PayMongo has disabled, which it does silently after repeated
    // failures and which otherwise looks like payments quietly not confirming.
    ensurePayMongoWebhook().catch((cause) => {
      console.error('PayMongo webhook check failed', cause)
      return { status: 'failed' as const, error: String(cause) }
    }),
  ])

  if (webhook.status === 'failed') {
    console.error('PayMongo webhook could not be verified:', webhook.error)
  } else if (webhook.status !== 'unchanged' && webhook.status !== 'skipped') {
    console.log(`PayMongo webhook ${webhook.status}: ${webhook.url}`)
  }

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
    webhook,
  })
}
