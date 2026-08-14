import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { payMongoConfigured } from '@/lib/payments/paymongo'
import { sendInBackground } from '@/lib/email/send'
import {
  guestHoldReceipt,
  guestConfirmed,
  ownerNewBooking,
  ownerProofUploaded,
  type BookingEmailData,
} from '@/lib/email/templates'
import policy from '../../../content/policy.json'

/* Turns a booking row into email. Every function here is called AFTER the
   database work has committed, and none of them are awaited by a request the
   guest is waiting on — a mail outage must never cost someone their booking. */

const PACKAGE_LABEL: Record<string, string> = {
  DAY_TOUR: 'Day tour, 7:00 AM to 5:00 PM',
  NIGHT_TOUR: 'Night tour, 8:00 PM to 6:00 AM the next morning',
  FULL_STAY: 'Full stay, 2:00 PM to 12:00 noon the next day — 22 hours',
  CUSTOM: 'Custom hours',
}

function ownerAddress(): string {
  return process.env.EMAIL_OWNER ?? 'casanovatraveltours@gmail.com'
}

/** The rules a guest is told about, in the order they matter on the day. */
export function houseRulesForGuests(videokeCurfew: string): string[] {
  const drafted = policy.houseRules.$drafted.map((rule) => rule.rule)
  return [
    `Videoke until ${videokeCurfew}.`,
    'Clean as you go.',
    'Any damage to the property is charged to the guest.',
    ...drafted,
  ]
}

async function load(bookingId: string): Promise<BookingEmailData | null> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { unit: true },
  })
  if (!booking) return null

  return {
    reference: booking.reference,
    unitId: booking.unitId,
    unitName: booking.unit.name,
    packageLabel: PACKAGE_LABEL[booking.package] ?? booking.package,
    checkInAt: booking.checkInAt,
    checkOutAt: booking.checkOutAt,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,
    guestAddress: booking.guestAddress,
    paxTotal: booking.paxTotal,
    paxUnder4: booking.paxUnder4,
    pets: booking.pets,
    extensionHours: booking.extensionHours,
    guestNote: booking.guestNote,
    lines: booking.breakdown as BookingEmailData['lines'],
    total: booking.total,
    depositDue: booking.depositDue,
    balanceDue: booking.balanceDue,
    holdExpiresAt: booking.holdExpiresAt,
    status: booking.status,
  }
}

/** The receipt the owner asked for: everything the guest filled in, back to them. */
export async function notifyNewBooking(bookingId: string): Promise<void> {
  const data = await load(bookingId)
  if (!data) return

  const settings = await getSettings()
  // Same rule the site follows: when card and e-wallet payment is live, the
  // account numbers are not published anywhere, including here.
  const onlinePaymentReady = settings.paymentMethods.paymongo && payMongoConfigured()
  const bank = onlinePaymentReady
    ? null
    : {
        gcash: settings.bankDetails.gcash.number,
        maya: settings.bankDetails.maya.number,
        bpi: settings.bankDetails.bpi.account,
        name: settings.bankDetails.gcash.name,
      }

  sendInBackground(guestHoldReceipt(data, bank), `receipt ${data.reference}`)
  sendInBackground(ownerNewBooking(data, ownerAddress()), `owner alert ${data.reference}`)
}

export async function notifyProofUploaded(bookingId: string, method: string): Promise<void> {
  const data = await load(bookingId)
  if (!data) return
  sendInBackground(ownerProofUploaded(data, ownerAddress(), method), `proof ${data.reference}`)
}

export async function notifyConfirmed(bookingId: string): Promise<void> {
  const data = await load(bookingId)
  if (!data) return
  const settings = await getSettings()
  sendInBackground(
    guestConfirmed(data, houseRulesForGuests(settings.videokeCurfew)),
    `confirmation ${data.reference}`,
  )
}
