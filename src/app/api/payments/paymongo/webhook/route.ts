import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { settleBooking } from '@/lib/payments/settle'

export const dynamic = 'force-dynamic'

/* PayMongo calls this when a payment succeeds or fails.

   The body is treated as a hint, never as proof. Whatever it claims, the site
   looks up the booking, asks PayMongo directly whether the session is paid, and
   only then confirms. So a forged POST to this URL cannot confirm anything —
   the worst it can do is make the server ask PayMongo a question.

   Always answers 200 once the event has been taken. A non-200 makes PayMongo
   retry, and retrying will not fix a booking we cannot find. Real problems are
   logged rather than bounced back. */

function referenceFrom(payload: unknown): string | null {
  // The reference travels two ways depending on the event, so both are checked.
  const event = payload as {
    data?: {
      attributes?: {
        data?: {
          attributes?: {
            metadata?: Record<string, string>
            reference_number?: string
            description?: string
          }
        }
      }
    }
  }

  const attributes = event?.data?.attributes?.data?.attributes
  const fromMetadata = attributes?.metadata?.reference
  if (fromMetadata) return fromMetadata

  const fromReference = attributes?.reference_number
  if (fromReference) return fromReference

  // Last resort: our references have a fixed shape, so one can be recovered
  // from the description PayMongo echoes back.
  const match = attributes?.description?.match(/RF-[CG]-\d{4}-\d{4}/)
  return match ? match[0] : null
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ received: true, note: 'unreadable body' })
  }

  const type =
    (payload as { data?: { attributes?: { type?: string } } })?.data?.attributes?.type ?? 'unknown'
  const reference = referenceFrom(payload)

  await db.auditLog.create({
    data: {
      action: 'paymongo.webhook',
      entity: 'payment',
      entityId: reference,
      actorName: 'paymongo',
      meta: { type },
    },
  })

  if (!reference) {
    console.error('PayMongo webhook carried no booking reference', type)
    return NextResponse.json({ received: true })
  }

  try {
    // Re-verifies against PayMongo before confirming anything.
    const outcome = await settleBooking(reference)
    if (outcome.status === 'underpaid') {
      console.error(
        `PayMongo paid less than owed on ${reference}: expected ${outcome.expected}, received ${outcome.received}`,
      )
    }
    return NextResponse.json({ received: true, outcome: outcome.status })
  } catch (cause) {
    // Still 200: a retry would hit the same error, and the guest returning from
    // checkout settles the booking anyway.
    console.error('PayMongo webhook could not be settled', cause)
    return NextResponse.json({ received: true, error: 'logged' })
  }
}
