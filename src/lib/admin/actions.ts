'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAdmin, recordAction } from '@/lib/auth'
import { notifyConfirmed, notifyNewBooking } from '@/lib/email/notify'
import { saveSettings, type Settings } from '@/lib/settings'

/* Every action here re-checks the session on the server. The proxy that guards
   /admin is a convenience for routing; it is not the thing keeping anyone out. */

function refresh(reference?: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/bookings')
  if (reference) revalidatePath(`/admin/bookings/${reference}`)
}

export async function confirmBooking(reference: string) {
  await requireAdmin()

  const booking = await db.booking.findUnique({ where: { reference } })
  if (!booking) throw new Error('No such booking.')

  await db.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date(), holdExpiresAt: null },
    })
    await tx.payment.updateMany({
      where: { bookingId: booking.id, status: 'SUBMITTED' },
      data: { status: 'VERIFIED', verifiedAt: new Date() },
    })
  })

  await recordAction('booking.confirmed', 'booking', booking.id, { reference })
  void notifyConfirmed(booking.id).catch((cause) =>
    console.error('Confirmed but could not email the guest', cause),
  )

  refresh(reference)
}

export async function rejectPayment(reference: string, reason: string) {
  await requireAdmin()

  const booking = await db.booking.findUnique({ where: { reference } })
  if (!booking) throw new Error('No such booking.')

  await db.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { bookingId: booking.id, status: 'SUBMITTED' },
      data: { status: 'REJECTED', rejectedNote: reason.slice(0, 500) },
    })
    // Back to PENDING rather than cancelled: the guest may simply have uploaded
    // the wrong screenshot, and their date should not disappear over it.
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'PENDING' },
    })
  })

  await recordAction('payment.rejected', 'booking', booking.id, { reference, reason })
  refresh(reference)
}

export async function cancelBooking(reference: string, reason: string) {
  await requireAdmin()

  const booking = await db.booking.findUnique({ where: { reference } })
  if (!booking) throw new Error('No such booking.')

  await db.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      internalNote: [booking.internalNote, `Cancelled: ${reason}`].filter(Boolean).join('\n'),
    },
  })

  await recordAction('booking.cancelled', 'booking', booking.id, { reference, reason })
  refresh(reference)
}

export async function markPaidOnSite(reference: string) {
  await requireAdmin()

  const booking = await db.booking.findUnique({ where: { reference } })
  if (!booking) throw new Error('No such booking.')

  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        method: 'CASH',
        status: 'VERIFIED',
        amount: booking.depositDue,
        verifiedAt: new Date(),
      },
    })
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date(), holdExpiresAt: null },
    })
  })

  await recordAction('booking.paid_on_site', 'booking', booking.id, { reference })
  void notifyConfirmed(booking.id).catch(() => {})
  refresh(reference)
}

export async function saveInternalNote(reference: string, note: string) {
  await requireAdmin()
  const booking = await db.booking.update({
    where: { reference },
    data: { internalNote: note.slice(0, 2000) },
  })
  await recordAction('booking.note', 'booking', booking.id, { reference })
  refresh(reference)
}

export async function resendGuestEmail(reference: string) {
  await requireAdmin()
  const booking = await db.booking.findUnique({ where: { reference } })
  if (!booking) throw new Error('No such booking.')

  if (booking.status === 'CONFIRMED') {
    await notifyConfirmed(booking.id)
  } else {
    await notifyNewBooking(booking.id)
  }

  await recordAction('booking.email_resent', 'booking', booking.id, { reference })
  refresh(reference)
}

/* --- calendar ------------------------------------------------------------- */

export async function blockDates(
  unitId: string,
  startDate: string,
  endDate: string,
  reason: string,
) {
  await requireAdmin()

  // Dates arrive as calendar days; a block runs from the start of the first to
  // the end of the last, in Philippine time.
  const startAt = new Date(`${startDate}T00:00:00+08:00`)
  const endAt = new Date(`${endDate}T23:59:59+08:00`)
  if (endAt <= startAt) throw new Error('The end date has to be on or after the start date.')

  const block = await db.calendarBlock.create({
    data: { unitId, startAt, endAt, source: 'MANUAL', reason: reason.slice(0, 200) || 'Closed' },
  })

  await recordAction('calendar.blocked', 'calendar_block', block.id, {
    unitId,
    startDate,
    endDate,
    reason,
  })
  revalidatePath('/admin/calendar')
  revalidatePath('/farm')
}

export async function unblockDates(blockId: string) {
  await requireAdmin()

  const block = await db.calendarBlock.findUnique({ where: { id: blockId } })
  if (!block) return

  if (block.source === 'AIRBNB_ICAL') {
    // Deleting it would only bring it back on the next import, and in the
    // meantime the date would look free while Airbnb has it sold.
    throw new Error('This came from Airbnb. Cancel it there and it will clear on the next sync.')
  }

  await db.calendarBlock.delete({ where: { id: blockId } })
  await recordAction('calendar.unblocked', 'calendar_block', blockId, {})
  revalidatePath('/admin/calendar')
  revalidatePath('/farm')
}

/* --- rates and settings --------------------------------------------------- */

export async function updateRate(unitId: string, packageKey: string, price: number) {
  await requireAdmin()
  if (!Number.isInteger(price) || price < 0) throw new Error('Enter a whole number of pesos.')

  const plan = await db.ratePlan.findFirst({
    where: { unitId, package: packageKey as never },
  })
  if (!plan) throw new Error('No such rate.')

  await db.ratePlan.update({ where: { id: plan.id }, data: { price } })
  await recordAction('rate.updated', 'rate_plan', plan.id, {
    unitId,
    packageKey,
    from: plan.price,
    to: price,
  })

  revalidatePath('/admin/rates')
  revalidatePath('/casita')
  revalidatePath('/gazebo')
  revalidatePath('/farm')
}

export async function updateExtensionRate(unitId: string, perHour: number) {
  await requireAdmin()
  if (!Number.isInteger(perHour) || perHour < 0) throw new Error('Enter a whole number of pesos.')

  await db.unit.update({ where: { id: unitId }, data: { extensionRate: perHour } })
  await recordAction('rate.extension_updated', 'unit', unitId, { perHour })
  revalidatePath('/admin/rates')
}

export async function updateSettings(patch: Partial<Settings>) {
  await requireAdmin()

  if (patch.turnoverMinutes !== undefined && patch.turnoverMinutes > 30) {
    // Above 30 the buffer eats the whole hour between a night tour checking out
    // at 06:00 and a day tour checking in at 07:00, and that pair silently
    // stops being sellable.
    throw new Error(
      'Turnover cannot go above 30 minutes, or a night tour and the next morning’s day tour stop fitting together.',
    )
  }
  if (patch.depositPercent !== undefined && (patch.depositPercent < 1 || patch.depositPercent > 100)) {
    throw new Error('The deposit has to be between 1% and 100%.')
  }

  const next = await saveSettings(patch)
  await recordAction('settings.updated', 'setting', 'site', patch as Record<string, unknown>)

  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
  return next
}

export async function saveIcalFeed(unitId: string, url: string) {
  await requireAdmin()
  const trimmed = url.trim()

  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    throw new Error('Paste the full address, starting with https://')
  }

  if (!trimmed) {
    await db.icalFeed.deleteMany({ where: { unitId } })
  } else {
    await db.icalFeed.upsert({
      where: { unitId },
      create: { unitId, url: trimmed, active: true },
      update: { url: trimmed, active: true, lastError: null, failureCount: 0 },
    })
  }

  await recordAction('ical.feed_saved', 'ical_feed', unitId, { url: trimmed })
  revalidatePath('/admin/settings')
}
