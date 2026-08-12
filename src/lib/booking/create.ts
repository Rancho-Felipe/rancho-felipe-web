import { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { quote, type AddOnChoice, type Quote, type RateBand } from '@/lib/booking/pricing'
import {
  holdWindow,
  resolveWindow,
  resortDate,
  type PackageKey,
} from '@/lib/booking/schedule'
import { getSettings } from '@/lib/settings'

/* ---------------------------------------------------------------------------
   Creating a booking.

   Three things can steal a date between the moment a guest sees it as free and
   the moment they press the button:

     1. another guest booking the same slot   -> caught by the exclusion
                                                  constraint in the database
     2. the owner blocking the date in admin  -> checked inside the transaction
     3. an Airbnb import landing              -> same check, same transaction

   The first is the dangerous one, because it is a genuine race between two web
   requests. It is not handled in application code at all: Postgres refuses the
   second INSERT. Everything here is about turning that refusal into a sentence
   a guest can understand.
--------------------------------------------------------------------------- */

export class SlotTakenError extends Error {
  constructor(message = 'Those dates were just taken. Please pick another slot.') {
    super(message)
    this.name = 'SlotTakenError'
  }
}

export class BookingRejected extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookingRejected'
  }
}

export interface CreateBookingInput {
  unitId: 'casita' | 'gazebo'
  package: Exclude<PackageKey, 'CUSTOM'>
  /** Arrival date in Philippine time, yyyy-MM-dd. */
  date: string
  paxTotal: number
  paxUnder4: number
  pets: number
  extensionHours: number
  addOnIds: string[]
  guestName: string
  guestEmail: string
  guestPhone: string
  guestAddress: string
  guestNote?: string
}

export interface CreatedBooking {
  id: string
  reference: string
  checkInAt: Date
  checkOutAt: Date
  quote: Quote
}

const UNIT_LETTER: Record<string, string> = { casita: 'C', gazebo: 'G' }

/**
 * Postgres raises 23P01 (exclusion_violation) when the guard rejects a booking.
 * That is the only error here a guest could plausibly cause, and it deserves a
 * plain sentence rather than a stack trace.
 */
/**
 * Serializable transactions legitimately abort when two of them touch the same
 * row — here, the per-unit reference counter. Postgres is not reporting a
 * problem with the booking; it is asking us to try again.
 */
function isSerializationFailure(error: unknown): boolean {
  // Prisma translates Postgres 40001/40P01 into P2034 and rewrites the message,
  // so the raw SQLSTATE is not always visible. Match both.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
    return true
  }
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('40001') ||
    message.includes('40P01') ||
    message.includes('could not serialize') ||
    message.includes('deadlock detected') ||
    message.includes('write conflict or a deadlock')
  )
}

function isOverlapViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma surfaces raw Postgres codes on P2010 for $queryRaw, and maps some
    // constraint failures to P2002/P2034. Check the underlying code too.
    const meta = error.meta as { code?: string; constraint?: string } | undefined
    if (meta?.code === '23P01') return true
    if (typeof meta?.constraint === 'string' && meta.constraint.includes('booking_no_overlap')) {
      return true
    }
  }
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('booking_no_overlap') || message.includes('23P01')
}

export async function createBooking(input: CreateBookingInput): Promise<CreatedBooking> {
  const settings = await getSettings()

  const unit = await db.unit.findUnique({
    where: { id: input.unitId },
    include: { ratePlans: true },
  })
  if (!unit) throw new BookingRejected('That unit does not exist.')

  const stay = resolveWindow(input.date, input.package)
  const held = holdWindow(stay, settings.turnoverMinutes, input.extensionHours)

  // A guest cannot book a slot that has already started, and cannot book one
  // starting inside the cutoff — the caretakers need warning.
  const cutoffMs = settings.sameDayCutoffHours * 3_600_000
  if (stay.checkInAt.getTime() - Date.now() < cutoffMs) {
    throw new BookingRejected(
      `Bookings close ${settings.sameDayCutoffHours} hours before check-in. Please call the resort for tonight.`,
    )
  }

  const addOns = input.addOnIds.length
    ? await db.addOn.findMany({ where: { id: { in: input.addOnIds }, active: true } })
    : []

  const addOnChoices: AddOnChoice[] = addOns.map((addOn) => ({
    id: addOn.id,
    name: addOn.name,
    price: addOn.price,
    quantity: 1,
    payOnSite: addOn.payOnSite,
  }))

  const bands: RateBand[] = unit.ratePlans.map((plan) => ({
    package: plan.package as PackageKey,
    minPax: plan.minPax,
    maxPax: plan.maxPax,
    price: plan.price,
  }))

  const priced = quote({
    unitId: input.unitId,
    package: input.package,
    paxTotal: input.paxTotal,
    paxUnder4: input.paxUnder4,
    bands,
    extraGuestFee: settings.extraGuestFee,
    extensionHours: input.extensionHours,
    extensionRatePerHour: unit.extensionRate,
    addOns: addOnChoices,
    depositPercent: settings.depositPercent,
  })

  const year = Number(resortDate(stay.checkInAt).slice(0, 4))
  const holdExpiresAt = new Date(Date.now() + settings.holdHours * 3_600_000)

  // Two guests booking at the same moment both touch the reference counter, and
  // Serializable will abort one of them. That is a retry, not a rejection.
  const MAX_ATTEMPTS = 5
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await runBookingTransaction()
    } catch (error) {
      lastError = error
      if (isSerializationFailure(error) && attempt < MAX_ATTEMPTS) {
        // Small jittered backoff so retries do not collide again immediately.
        await new Promise((resolve) => setTimeout(resolve, attempt * 15 + Math.random() * 20))
        continue
      }
      if (error instanceof SlotTakenError) throw error
      if (isOverlapViolation(error)) throw new SlotTakenError()
      throw error
    }
  }

  if (lastError instanceof SlotTakenError) throw lastError
  if (isOverlapViolation(lastError)) throw new SlotTakenError()
  throw lastError

  async function runBookingTransaction(): Promise<CreatedBooking> {
    return await db.$transaction(
      async (tx) => {
        // Release any dead hold sitting on this exact window first. The
        // exclusion constraint counts PENDING rows regardless of whether their
        // hold has run out, so without this a guest could be shown a free slot
        // by the availability reader and then be refused by the database.
        await tx.booking.updateMany({
          where: {
            unitId: input.unitId,
            status: 'PENDING',
            holdExpiresAt: { lt: new Date() },
            heldFrom: { lt: held.heldUntil },
            heldUntil: { gt: held.heldFrom },
          },
          data: { status: 'EXPIRED' },
        })

        // (2) and (3): dates the owner closed, and anything Airbnb has told us
        // about. These live in calendar_block, where overlapping rows from two
        // sources are legitimate, so no constraint can do this for us.
        const blocking = await tx.calendarBlock.findFirst({
          where: {
            unitId: input.unitId,
            startAt: { lt: held.heldUntil },
            endAt: { gt: held.heldFrom },
          },
        })
        if (blocking) {
          throw new SlotTakenError(
            blocking.source === 'AIRBNB_ICAL'
              ? 'That slot is already booked on Airbnb.'
              : 'The resort has closed those dates.',
          )
        }

        // Atomic per-unit, per-year counter. The UPSERT returns the incremented
        // value, so two simultaneous bookings cannot be handed the same code.
        const counter = await tx.bookingCounter.upsert({
          where: { unitId_year: { unitId: input.unitId, year } },
          create: { unitId: input.unitId, year, lastNumber: 1 },
          update: { lastNumber: { increment: 1 } },
        })

        const reference = `RF-${UNIT_LETTER[input.unitId]}-${year}-${String(counter.lastNumber).padStart(4, '0')}`

        // (1): if another request has this slot, the INSERT fails here.
        const booking = await tx.booking.create({
          data: {
            reference,
            unitId: input.unitId,
            package: input.package,
            checkInAt: stay.checkInAt,
            checkOutAt: held.checkOutAt,
            heldFrom: held.heldFrom,
            heldUntil: held.heldUntil,
            status: 'PENDING',
            source: 'DIRECT',
            guestName: input.guestName,
            guestEmail: input.guestEmail,
            guestPhone: input.guestPhone,
            guestAddress: input.guestAddress,
            guestNote: input.guestNote,
            paxTotal: input.paxTotal,
            paxUnder4: input.paxUnder4,
            pets: input.pets,
            extensionHours: input.extensionHours,
            subtotal: priced.subtotal,
            extrasTotal: priced.extrasTotal,
            total: priced.total,
            depositDue: priced.depositDue,
            balanceDue: priced.balanceDue,
            breakdown: priced.lines as unknown as Prisma.InputJsonValue,
            holdExpiresAt,
            addOns: {
              create: addOnChoices.map((choice) => ({
                addOnId: choice.id,
                quantity: choice.quantity,
                unitPrice: choice.price,
                total: choice.price * choice.quantity,
              })),
            },
          },
        })

        return {
          id: booking.id,
          reference: booking.reference,
          checkInAt: booking.checkInAt,
          checkOutAt: booking.checkOutAt,
          quote: priced,
        }
      },
      {
        // Serializable so the block check and the insert see one consistent
        // world. Without it, a block written between the two would be missed.
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15_000,
      },
    )
  }
}
