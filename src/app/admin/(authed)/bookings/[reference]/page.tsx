import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { inResortTime } from '@/lib/booking/schedule'
import { peso } from '@/lib/content'
import {
  confirmBooking,
  rejectPayment,
  cancelBooking,
  markPaidOnSite,
  saveInternalNote,
  resendGuestEmail,
} from '@/lib/admin/actions'

export const metadata: Metadata = { title: 'Booking', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function AdminBookingPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params

  const booking = await db.booking.findUnique({
    where: { reference: reference.toUpperCase() },
    include: {
      unit: true,
      addOns: { include: { addOn: true } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!booking) notFound()

  const lines = booking.breakdown as Array<{ label: string; detail?: string; amount: number }>
  const submitted = booking.payments.find((payment) => payment.status === 'SUBMITTED')
  const accent = booking.unitId === 'casita' ? 'text-pool' : 'text-brick'

  async function confirm() {
    'use server'
    await confirmBooking(booking!.reference)
  }
  async function paidOnSite() {
    'use server'
    await markPaidOnSite(booking!.reference)
  }
  async function reject(formData: FormData) {
    'use server'
    await rejectPayment(booking!.reference, String(formData.get('reason') ?? 'Could not verify'))
  }
  async function cancel(formData: FormData) {
    'use server'
    await cancelBooking(booking!.reference, String(formData.get('reason') ?? 'Cancelled by resort'))
  }
  async function note(formData: FormData) {
    'use server'
    await saveInternalNote(booking!.reference, String(formData.get('note') ?? ''))
  }
  async function resend() {
    'use server'
    await resendGuestEmail(booking!.reference)
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <Link href="/admin/bookings" className="text-sm text-stone hover:text-paper">
        ← All bookings
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline gap-4">
        <h1 className="font-data text-2xl text-paper">{booking.reference}</h1>
        <span className={`font-display text-lg ${accent}`}>{booking.unit.name}</span>
        <span className="ml-auto rounded-full border border-night-edge px-3 py-1 text-xs text-stone">
          {booking.status.replace(/_/g, ' ').toLowerCase()}
        </span>
      </div>

      {/* --- the receipt to check ------------------------------------------ */}
      {submitted && (
        <section className="mt-8 rounded-2xl border border-brick bg-night-raised p-6">
          <h2 className="font-display text-lg text-brick-lift">Check this receipt</h2>
          <p className="mt-1 text-sm text-stone">
            {submitted.method} · {peso(submitted.amount)}
            {submitted.reference && <> · ref {submitted.reference}</>} · uploaded{' '}
            {submitted.proofUploadedAt ? inResortTime(submitted.proofUploadedAt) : '—'}
          </p>

          {submitted.proofData && (
            <a
              href={`/api/admin/proof/${submitted.id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block max-w-sm overflow-hidden rounded-xl border border-night-edge"
            >
              {/* Served through an authenticated route, never from /public. */}
              <img
                src={`/api/admin/proof/${submitted.id}`}
                alt={`Payment receipt for ${booking.reference}`}
                className="w-full"
              />
            </a>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <form action={confirm}>
              <button
                type="submit"
                className="rounded-full bg-field px-6 py-2.5 text-sm font-medium text-ink"
              >
                Payment is good — confirm
              </button>
            </form>

            <form action={reject} className="flex flex-wrap items-center gap-2">
              <input
                name="reason"
                placeholder="What was wrong?"
                className="rounded-lg border border-night-edge bg-night px-3 py-2 text-sm text-paper"
              />
              <button
                type="submit"
                className="rounded-full border border-stone/40 px-5 py-2.5 text-sm text-paper hover:border-stone"
              >
                Reject
              </button>
            </form>
          </div>
          <p className="mt-3 text-xs text-stone">
            Rejecting puts the booking back to unpaid and keeps the date held, so the guest can send
            the right screenshot.
          </p>
        </section>
      )}

      {/* --- details -------------------------------------------------------- */}
      <section className="mt-8 rounded-2xl border border-night-edge bg-night-raised p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Check in" value={inResortTime(booking.checkInAt)} />
          <Detail label="Check out" value={inResortTime(booking.checkOutAt)} />
          <Detail label="Guest" value={booking.guestName} />
          <Detail label="Contact" value={booking.guestPhone} />
          <Detail label="Email" value={booking.guestEmail} />
          <Detail label="Address" value={booking.guestAddress} />
          <Detail
            label="Guests"
            value={`${booking.paxTotal}${booking.paxUnder4 ? ` (${booking.paxUnder4} under 4)` : ''}`}
          />
          <Detail label="Pets" value={String(booking.pets)} />
          {booking.extensionHours > 0 && (
            <Detail label="Extra hours" value={String(booking.extensionHours)} />
          )}
          <Detail label="Booked" value={inResortTime(booking.createdAt)} />
        </dl>

        {booking.guestNote && (
          <div className="mt-5 border-t hairline pt-4">
            <p className="eyebrow">From the guest</p>
            <p className="mt-1 text-sm text-paper">{booking.guestNote}</p>
          </div>
        )}

        <dl className="mt-6 space-y-2 border-t hairline pt-4">
          {lines.map((line, index) => (
            <div key={index} className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-stone">{line.label}</dt>
              <dd className="font-data text-sm text-paper">{peso(line.amount)}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 border-t hairline pt-2">
            <dt className="text-sm text-paper">Total</dt>
            <dd className="font-data text-base text-paper">{peso(booking.total)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-stone">Deposit</dt>
            <dd className="font-data text-sm text-stone">{peso(booking.depositDue)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-stone">To collect on arrival</dt>
            <dd className="font-data text-sm text-stone">{peso(booking.balanceDue)}</dd>
          </div>
        </dl>
      </section>

      {/* --- payment history ------------------------------------------------ */}
      {booking.payments.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg">Payments</h2>
          <ul className="mt-3 space-y-2">
            {booking.payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-night-edge px-4 py-3 text-sm"
              >
                <span className="font-data text-paper">{peso(payment.amount)}</span>
                <span className="text-stone">{payment.method}</span>
                <span className="text-stone">{payment.status.toLowerCase()}</span>
                {payment.reference && <span className="font-data text-xs text-stone">{payment.reference}</span>}
                <span className="ml-auto font-data text-xs text-stone">
                  {inResortTime(payment.createdAt, 'd MMM, h:mm a')}
                </span>
                {payment.proofData && (
                  <a
                    href={`/api/admin/proof/${payment.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-pool-lift underline underline-offset-4"
                  >
                    receipt
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- what the owner can do ------------------------------------------ */}
      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-night-edge bg-night-raised p-6">
          <h2 className="font-display text-base">Private note</h2>
          <p className="mt-1 text-xs text-stone">Only you see this. It is never emailed.</p>
          <form action={note} className="mt-3">
            <textarea
              name="note"
              rows={4}
              defaultValue={booking.internalNote ?? ''}
              className="w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
            />
            <button
              type="submit"
              className="mt-3 rounded-full border border-stone/40 px-5 py-2 text-sm text-paper hover:border-stone"
            >
              Save note
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-night-edge bg-night-raised p-6">
          <h2 className="font-display text-base">Other actions</h2>

          <div className="mt-4 space-y-3">
            {booking.status !== 'CONFIRMED' && booking.status !== 'CANCELLED' && (
              <form action={paidOnSite}>
                <button
                  type="submit"
                  className="w-full rounded-full border border-stone/40 px-5 py-2.5 text-sm text-paper hover:border-stone"
                >
                  They paid in cash — confirm
                </button>
              </form>
            )}

            <form action={resend}>
              <button
                type="submit"
                className="w-full rounded-full border border-stone/40 px-5 py-2.5 text-sm text-paper hover:border-stone"
              >
                Resend the guest their email
              </button>
            </form>

            {booking.status !== 'CANCELLED' && (
              <form action={cancel} className="space-y-2 border-t hairline pt-3">
                <input
                  name="reason"
                  placeholder="Why is it being cancelled?"
                  className="w-full rounded-lg border border-night-edge bg-night px-3 py-2 text-sm text-paper"
                />
                <button
                  type="submit"
                  className="w-full rounded-full border border-brick/50 px-5 py-2.5 text-sm text-brick-lift hover:border-brick"
                >
                  Cancel this booking
                </button>
                <p className="text-xs text-stone">This frees the date immediately.</p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm text-paper">{value}</dd>
    </div>
  )
}
