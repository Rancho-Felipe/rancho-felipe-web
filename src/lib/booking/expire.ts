import { db } from '@/lib/db'

/* Pending bookings hold a date while the guest goes off to pay. If the deposit
   never arrives, the date has to go back on sale.

   Belt and braces on purpose: a scheduled job sweeps them, and the availability
   reader would otherwise be the only thing standing between a dead hold and a
   lost sale. The sweep is idempotent, so running it twice is harmless.

   Bookings that already have a receipt uploaded are never expired — those are
   waiting on the owner, not on the guest. */
export async function expireStaleHolds(now = new Date()): Promise<{ expired: number; references: string[] }> {
  const stale = await db.booking.findMany({
    where: {
      status: 'PENDING',
      holdExpiresAt: { lt: now },
    },
    select: { id: true, reference: true },
  })

  if (stale.length === 0) return { expired: 0, references: [] }

  await db.$transaction([
    db.booking.updateMany({
      where: { id: { in: stale.map((booking) => booking.id) } },
      data: { status: 'EXPIRED' },
    }),
    db.auditLog.create({
      data: {
        action: 'booking.hold.expired',
        entity: 'booking',
        actorName: 'system',
        meta: { references: stale.map((booking) => booking.reference) },
      },
    }),
  ])

  return { expired: stale.length, references: stale.map((booking) => booking.reference) }
}
