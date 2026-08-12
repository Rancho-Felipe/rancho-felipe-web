import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

/* Payment receipts show bank details and phone numbers, so they never live in
   /public. They are held in the database and served only to a signed-in admin,
   with caching switched off at every layer. */

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return new Response('Not authorised', { status: 401 })
  }

  const { paymentId } = await params
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { proofData: true, proofMime: true, proofName: true },
  })

  if (!payment?.proofData) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(payment.proofData), {
    headers: {
      'Content-Type': payment.proofMime ?? 'application/octet-stream',
      // Never rendered as a document, whatever the bytes claim to be.
      'Content-Disposition': `inline; filename="${(payment.proofName ?? 'receipt').replace(/["\r\n]/g, '')}"`,
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  })
}
