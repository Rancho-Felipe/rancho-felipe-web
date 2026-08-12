import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { notifyProofUploaded } from '@/lib/email/notify'

export const dynamic = 'force-dynamic'

/* Guests upload a screenshot of their GCash, Maya or BPI transfer. There is no
   consumer API for any of them, so a person has to look at the receipt — this
   endpoint's job is to take the file safely and put the booking in front of the
   owner. */

const MAX_BYTES = 5 * 1024 * 1024

/** Only real image formats. Checked against the file's own bytes, not the
 *  browser's claim about them. */
const SIGNATURES: Array<{ mime: string; test: (bytes: Uint8Array) => boolean }> = [
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/webp',
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    // HEIC, which is what an iPhone sends unless the guest changed a setting.
    mime: 'image/heic',
    test: (b) =>
      b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70,
  },
]

const fields = z.object({
  reference: z.string().trim().min(6).max(32),
  method: z.enum(['GCASH', 'MAYA', 'BPI']),
  payerReference: z.string().trim().max(80).optional(),
})

export async function POST(request: Request) {
  const limited = await rateLimit(request, { key: 'proof', limit: 10, windowMs: 10 * 60_000 })
  if (limited) return limited

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Send the form as multipart data.' }, { status: 400 })
  }

  const parsed = fields.safeParse({
    reference: form.get('reference'),
    method: form.get('method'),
    payerReference: form.get('payerReference') || undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const file = form.get('proof')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Attach a photo of your receipt.' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'That image is over 5 MB. A screenshot is usually much smaller.' },
      { status: 413 },
    )
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const match = SIGNATURES.find((signature) => signature.test(bytes))
  if (!match) {
    return NextResponse.json(
      { error: 'That does not look like a photo. Send a JPG, PNG, WebP or HEIC.' },
      { status: 415 },
    )
  }

  const booking = await db.booking.findUnique({
    where: { reference: parsed.data.reference.toUpperCase() },
    select: { id: true, status: true, depositDue: true },
  })
  if (!booking) {
    return NextResponse.json({ error: 'We could not find that booking.' }, { status: 404 })
  }
  if (booking.status !== 'PENDING' && booking.status !== 'AWAITING_VERIFICATION') {
    return NextResponse.json(
      { error: 'This booking is not waiting for a payment.' },
      { status: 409 },
    )
  }

  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        method: parsed.data.method,
        status: 'SUBMITTED',
        amount: booking.depositDue,
        reference: parsed.data.payerReference,
        proofData: Buffer.from(bytes),
        // Trust the bytes, not the browser's content-type header.
        proofMime: match.mime,
        proofSize: file.size,
        proofName: file.name.slice(0, 120),
        proofUploadedAt: new Date(),
      },
    })

    // The dates stay held while the owner checks — that was the whole point of
    // the manual flow.
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'AWAITING_VERIFICATION' },
    })

    await tx.auditLog.create({
      data: {
        action: 'payment.proof.uploaded',
        entity: 'booking',
        entityId: booking.id,
        actorName: 'guest',
        meta: { method: parsed.data.method, bytes: file.size },
      },
    })
  })

  void notifyProofUploaded(booking.id, parsed.data.method).catch((cause) =>
    console.error('Proof saved but notification failed', cause),
  )

  return NextResponse.json({ ok: true })
}
